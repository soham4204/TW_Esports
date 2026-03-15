const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin securely for Serverless Environment
if (!admin.apps.length) {
  let adminConfig = {};
  
  // In Vercel Production, we use an Environment Variable for the secure key
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          adminConfig = { credential: admin.credential.cert(serviceAccount) };
      } catch (err) {
          console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY details", err);
      }
  } else {
      // Local fallback for Vercel Dev or testing
      try {
          const serviceAccount = require("../functions/serviceAccountKey.json");
          adminConfig = { credential: admin.credential.cert(serviceAccount) };
      } catch(e) {
          console.log("No service account found locally or in env vars.");
      }
  }

  admin.initializeApp(adminConfig);
}

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1482318118649856031";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "g8bNvE4jXx3Zo3T6MZDCb1XruCJKVTjo";

// Vercel serverless function export
module.exports = async (req, res) => {
  // CORS configuration for Vercel (allow origin)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
      const db = admin.firestore();
      
      const { code, redirectUri } = req.body;
      
      if (!code) {
        return res.status(400).send("Missing OAuth code");
      }

      // 2. Exchange 'code' for an Access Token
      const tokenResponse = await axios.post(
        "https://discord.com/api/oauth2/token",
        new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // 3. Fetch the user's Discord profile
      const userResponse = await axios.get("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const discordUser = userResponse.data;
      const uid = `discord:${discordUser.id}`;
      
      const avatarUrl = discordUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator) % 5}.png`;

      // 4. Save/Update user profile in Firestore
      await db.collection("users").doc(uid).set({
        discordId: discordUser.id,
        username: discordUser.username,
        avatar: avatarUrl,
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 5. Mint a Firebase Custom Auth Token
      const customToken = await admin.auth().createCustomToken(uid);

      // 6. Return the custom token to the frontend
      return res.status(200).json({
        token: customToken,
        user: {
          uid,
          username: discordUser.username,
          avatar: avatarUrl
        }
      });
      
    } catch (error) {
      console.error("Discord Auth Error:", error.response ? error.response.data : error.message);
      return res.status(500).json({ error: "Failed to authenticate with Discord" });
    }
};
