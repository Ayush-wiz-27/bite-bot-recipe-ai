/**
 * YouTube Transcript Service
 * 
 * Uses Supadata.ai (third-party API) to extract transcripts.
 * This completely avoids IP blocks from YouTube on Render.
 * 
 * Requires SUPADATA_API_KEY in .env
 */
const axios = require("axios");

const extractVideoId = (url) => {
  const patterns = [
    /(?:v=|\/v\/|youtu\.be\/)([0-9A-Za-z_-]{11})/,
    /(?:embed\/|shorts\/)([0-9A-Za-z_-]{11})/,
  ];
  for (const regex of patterns) {
    const match = url.match(regex);
    if (match) return match[1];
  }
  return null;
};

/**
 * Main export: get transcript from a YouTube URL.
 * Uses Supadata API which bypasses all datacenter IP bans.
 */
const getTranscript = async (url) => {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    throw new Error("SUPADATA_API_KEY is missing. Please get a free API key from supadata.ai and add it to your environment variables.");
  }

  console.log(`📝 Fetching captions for video: ${videoId} via Supadata API`);

  try {
    const response = await axios.get(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`, {
      headers: {
        "x-api-key": apiKey
      }
    });

    const data = response.data;
    let text = "";

    // Supadata typically returns an array of segments in 'content'
    const segments = data.content || data.data || data;
    
    if (Array.isArray(segments)) {
       text = segments.map(s => s.text).join(" ").replace(/\s+/g, " ").trim();
    } else if (typeof data.text === "string") {
       text = data.text;
    }

    if (!text || text.length < 20) {
      throw new Error("Caption transcript too short or empty");
    }

    console.log(`✅ Got ${text.length} chars of transcript from Supadata`);
    return text;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error("Supadata API error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch transcript from Supadata: ${errorMsg}`);
  }
};

module.exports = { getTranscript, extractVideoId };
