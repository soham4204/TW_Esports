import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LeaderboardTable from '../components/LeaderboardTable';
import LinkBrawlStarsModal from '../components/LinkBrawlStarsModal';
import { db, auth } from '../firebase-config';
import { Trophy, Shield } from 'lucide-react';

export default function LeaderboardPage() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [brawlStarsTag, setBrawlStarsTag] = useState('');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await db.collection('users').doc(currentUser.uid).get();
          if (userDoc.exists && userDoc.data().brawlStarsTag) {
            setBrawlStarsTag(userDoc.data().brawlStarsTag);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setBrawlStarsTag('');
      }
    });

    const unsubscribeTourneys = db.collection('tournaments').onSnapshot((snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTournaments(docs);
      if (docs.length > 0 && !selectedTournament) {
        setSelectedTournament(docs[0]);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTourneys();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              <Trophy className="text-yellow-500" size={36} /> Live Tournament Leaderboards
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time standings for Brawl Stars Trophy & Ranked Tournaments
            </p>
          </div>

          <div className="flex items-center gap-3">
            {brawlStarsTag ? (
              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="text-xs text-slate-400">Your Tag:</span>
                <span className="font-mono text-yellow-400 font-bold text-sm">{brawlStarsTag}</span>
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="text-[11px] text-blue-400 hover:underline ml-2"
                >
                  Change
                </button>
              </div>
            ) : user ? (
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded-xl transition shadow-lg shadow-yellow-500/20"
              >
                <Shield size={16} /> Link Player Tag
              </button>
            ) : null}
          </div>
        </div>

        {tournaments.length > 1 && (
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
            {tournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTournament(t)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                  selectedTournament?.id === t.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t.name || 'Tournament'}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-slate-500">Loading tournaments...</div>
        ) : selectedTournament ? (
          <div className="mt-6">
            <LeaderboardTable
              tournamentId={selectedTournament.id}
              tournamentCategory={selectedTournament.category || 'trophy'}
              currentPlayerTag={brawlStarsTag}
            />
          </div>
        ) : (
          <div className="p-16 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 mt-8">
            <Trophy size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-xl font-bold">No Active Tournaments Found</p>
            <p className="text-sm text-slate-400 mt-1">Check back soon for upcoming Brawl Stars cups!</p>
          </div>
        )}
      </div>

      <LinkBrawlStarsModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        user={user}
        onLinked={(data) => setBrawlStarsTag(data.tag)}
      />
    </div>
  );
}
