const axios = require("axios");

const extractVideoId = (url) => {
  const regex = /(?:v=|\/)([0-9A-Za-z_-]{11}).*/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getTranscript = async (url) => {
  try {
    const videoId = extractVideoId(url);

    if (!videoId) throw new Error("Invalid YouTube URL");

    // get captions list
    const captionsUrl = `https://video.google.com/timedtext?type=list&v=${videoId}`;
    const captionsRes = await axios.get(captionsUrl);

    // get first language track (usually English)
    const langMatch = captionsRes.data.match(/lang_code="([^"]+)"/);
    if (!langMatch) throw new Error("No captions available");

    const lang = langMatch[1];

    // fetch transcript XML
    const transcriptUrl = `https://video.google.com/timedtext?lang=${lang}&v=${videoId}`;
    const transcriptRes = await axios.get(transcriptUrl);

    const xml = transcriptRes.data;

    // extract text
    const regex = /<text[^>]*>(.*?)<\/text>/g;
    let result = "";
    let match;

    while ((match = regex.exec(xml)) !== null) {
      const text = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/<[^>]+>/g, "");

      result += text + " ";
    }

    return result.trim();

  } catch (error) {
    console.error("Transcript error:", error.message);
    throw new Error(error.message);
  }
};

module.exports = { getTranscript };
