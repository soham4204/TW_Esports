const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// Initialize Firebase Admin
let adminConfig = {};
try {
  const serviceAccount = require("./serviceAccountKey.json");
  adminConfig = {
    credential: admin.credential.cert(serviceAccount)
  };
  console.log("Loaded local serviceAccountKey.json successfully.");
} catch (e) {
  // Fallback to application default credentials
  console.log("No local serviceAccountKey.json found, relying on default credentials.");
}
admin.initializeApp(adminConfig);

// Hardcoded for now based on user input, normally these go in functions config
const DISCORD_CLIENT_ID = "1482318118649856031";
const DISCORD_CLIENT_SECRET = "g8bNvE4jXx3Zo3T6MZDCb1XruCJKVTjo";

// The redirect URI must match exactly what is set in the Discord Developer Portal
// For local development
const REDIRECT_URI = "http://localhost:3000/auth/discord/callback"; 

exports.discordLogin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const db = admin.firestore();
      
      // 1. Get the 'code' from the frontend request body
      const { code, redirectUri } = req.body;
      
      if (!code) {
        return res.status(400).send("Missing OAuth code");
      }

      // Use the redirectUri provided by the frontend if available, fallback to local
      const finalRedirectUri = redirectUri || REDIRECT_URI;

      // 2. Exchange 'code' for an Access Token from Discord
      const tokenResponse = await axios.post(
        "https://discord.com/api/oauth2/token",
        new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: finalRedirectUri,
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
        lastLogin: FieldValue.serverTimestamp()
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
  });
});
