/**
 * YouTube Transcript Service
 * 
 * Uses the 'youtube-transcript' npm package to extract captions/subtitles
 * directly from YouTube videos. This completely bypasses yt-dlp and avoids
 * bot detection from datacenter IPs (like Render).
 * 
 * The package works by scraping the YouTube watch page and extracting
 * transcript data from YouTube's internal API — no API key required.
 */

const extractVideoId = (url) => {
  // Handle various YouTube URL formats
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
 * Uses the youtube-transcript package — no API key needed,
 * no yt-dlp needed, works from datacenter IPs.
 */
const getTranscript = async (url) => {
  // Dynamic import since youtube-transcript is ESM-only
  const { YoutubeTranscript } = await import("youtube-transcript");

  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  console.log(`📝 Fetching captions for video: ${videoId}`);

  try {
    // Try English captions first
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
    });

    const text = transcript
      .map((segment) => segment.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text || text.length < 20) {
      throw new Error("Caption transcript too short or empty");
    }

    console.log(`✅ Got ${text.length} chars of transcript from YouTube captions`);
    return text;
  } catch (firstError) {
    // If English fails, try without specifying language (gets default/auto-generated)
    try {
      console.log("⚠️ English captions failed, trying default language...");
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      const text = transcript
        .map((segment) => segment.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (!text || text.length < 20) {
        throw new Error("Caption transcript too short or empty");
      }

      console.log(`✅ Got ${text.length} chars of transcript (default language)`);
      return text;
    } catch (secondError) {
      console.error("YouTube transcript error:", firstError.message);
      throw new Error(firstError.message);
    }
  }
};

module.exports = { getTranscript, extractVideoId };
