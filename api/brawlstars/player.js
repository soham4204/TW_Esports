const axios = require('axios');

const PROXY_URL = process.env.BRAWL_STARS_API_URL || 'https://bsproxy.royaleapi.dev/v1';
const API_KEY = process.env.BRAWL_STARS_API_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { tag } = req.query;
  if (!tag) {
    return res.status(400).json({ error: 'Player tag is required' });
  }

  const cleanTag = tag.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
  const encodedTag = '%23' + cleanTag;

  try {
    const response = await axios.get(`${PROXY_URL}/players/${encodedTag}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json'
      }
    });

    return res.status(200).json({
      success: true,
      tag: '#' + cleanTag,
      name: response.data.name,
      trophies: response.data.trophies,
      highestTrophies: response.data.highestTrophies,
      victories3v3: response.data['3vs3Victories'] || 0,
      club: response.data.club ? { name: response.data.club.name, tag: response.data.club.tag } : null,
      iconId: response.data.icon ? response.data.icon.id : null
    });
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const msg = error.response?.data?.message || error.message || 'Failed to fetch player';
    return res.status(status).json({ error: msg });
  }
};
