const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) {
  let adminConfig = {};
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminConfig = { credential: admin.credential.cert(serviceAccount) };
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY', e);
    }
  } else {
    try {
      const serviceAccount = require('../../functions/serviceAccountKey.json');
      adminConfig = { credential: admin.credential.cert(serviceAccount) };
    } catch (e) {}
  }
  admin.initializeApp(adminConfig);
}

const PROXY_URL = process.env.BRAWL_STARS_API_URL || 'https://bsproxy.royaleapi.dev/v1';
const API_KEY = process.env.BRAWL_STARS_API_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { tournamentId, playerTag } = req.body;
  if (!tournamentId || !playerTag) {
    return res.status(400).json({ error: 'Missing tournamentId or playerTag' });
  }

  const db = admin.firestore();
  const cleanTag = playerTag.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
  const formattedTag = '#' + cleanTag;

  try {
    // 1. Fetch Tournament details
    const tourneyDoc = await db.collection('tournaments').doc(tournamentId).get();
    if (!tourneyDoc.exists) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    const tourney = tourneyDoc.data();

    // 2. Fetch last 25 battles from Supercell API
    const response = await axios.get(`${PROXY_URL}/players/%23${cleanTag}/battlelog`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    const battles = response.data.items || [];

    const category = tourney.category || 'trophy'; // 'trophy' vs 'ranked'
    const tourneyStart = tourney.startsAt ? new Date(tourney.startsAt.toDate ? tourney.startsAt.toDate() : tourney.startsAt) : null;
    const tourneyEnd = tourney.endsAt ? new Date(tourney.endsAt.toDate ? tourney.endsAt.toDate() : tourney.endsAt) : null;

    let newlyAddedPoints = 0;
    let newMatchesCount = 0;

    const batch = db.batch();
    const battleLogsRef = db.collection('tournaments').doc(tournamentId).collection('battle_logs');

    for (const b of battles) {
      const bTimeStr = b.battleTime; // 'YYYYMMDDTHHMMSS.000Z'
      const match = bTimeStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
      const bDate = match ? new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6])) : new Date();

      // Check tournament start/end window
      if (tourneyStart && bDate < tourneyStart) continue;
      if (tourneyEnd && bDate > tourneyEnd) continue;

      const battleType = b.battle?.type || '';

      // Mode separation: Trophy vs Ranked
      if (category === 'trophy') {
        if (battleType === 'soloRanked' || battleType === 'teamRanked' || battleType === 'friendly') continue;
      } else if (category === 'ranked') {
        if (battleType !== 'soloRanked' && battleType !== 'teamRanked') continue;
      }

      // Check if this match was already recorded
      const docId = `${cleanTag}_${bTimeStr}`;
      const docSnap = await battleLogsRef.doc(docId).get();
      if (docSnap.exists) continue; // Already counted!

      // Calculate score for this match
      let pts = 0;
      const mode = (b.battle?.mode || b.event?.mode || '').toLowerCase();
      const isShowdown = mode.includes('showdown');

      if (isShowdown) {
        const rank = b.battle?.rank || 10;
        const rankTable = { 1: 150, 2: 110, 3: 80, 4: 55, 5: 35, 6: 15, 7: 15, 8: 10, 9: 10, 10: 10 };
        pts += rankTable[rank] || 10;
        if (b.battle?.trophyChange > 0) pts += b.battle.trophyChange;
      } else {
        const resStr = (b.battle?.result || '').toLowerCase();
        if (resStr === 'victory') pts += 100;
        else if (resStr === 'draw') pts += 35;
        else pts += 10;

        if (b.battle?.duration && b.battle.duration <= 90 && resStr === 'victory') pts += 20;
        if (b.battle?.starPlayer && b.battle.starPlayer.tag.replace(/[^0-9A-Z]/g, '') === cleanTag) pts += 40;
      }

      batch.set(battleLogsRef.doc(docId), {
        playerTag: formattedTag,
        battleTime: bTimeStr,
        mode: b.battle?.mode || b.event?.mode,
        result: b.battle?.result || (b.battle?.rank ? `Rank #${b.battle.rank}` : 'Completed'),
        score: pts,
        recordedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      newlyAddedPoints += pts;
      newMatchesCount += 1;
    }

    // Update Leaderboard document with cumulative score and registered Discord data
    const leaderboardRef = db.collection('tournaments').doc(tournamentId).collection('leaderboard').doc(formattedTag);

    let discordUsername = null;
    try {
      const teamsSnap = await db.collection('tournaments').doc(tournamentId).collection('teams').get();
      for (const tDoc of teamsSnap.docs) {
        const tData = tDoc.data();
        const tTag = (tData.playerTag || tData.player1Id || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
        if (tTag === cleanTag) {
          discordUsername = tData.discordUsername || tData.teamName || null;
          break;
        }
      }
    } catch (e) {
      console.warn('Teams lookup in sync error:', e.message);
    }

    const lbUpdate = {
      playerTag: formattedTag,
      totalScore: admin.firestore.FieldValue.increment(newlyAddedPoints),
      matchesPlayed: admin.firestore.FieldValue.increment(newMatchesCount),
      lastSyncedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (discordUsername) {
      lbUpdate.discordUsername = discordUsername;
      lbUpdate.playerName = discordUsername;
    }

    batch.set(leaderboardRef, lbUpdate, { merge: true });

    await batch.commit();

    // Read back updated total
    const updatedSnap = await leaderboardRef.get();
    return res.status(200).json({
      success: true,
      playerTag: formattedTag,
      newMatchesFound: newMatchesCount,
      pointsAdded: newlyAddedPoints,
      totalScore: updatedSnap.data()?.totalScore || 0,
      matchesPlayed: updatedSnap.data()?.matchesPlayed || 0
    });

  } catch (error) {
    console.error('Sync Error:', error);
    return res.status(500).json({ error: error.message || 'Sync failed' });
  }
};
