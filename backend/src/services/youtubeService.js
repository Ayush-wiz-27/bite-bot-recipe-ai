/**
 * YouTube Transcript Service
 *
 * Uses the 'youtube-transcript' npm package with a custom fetch function
 * that injects YouTube cookies. This makes requests look like an
 * authenticated user session, bypassing bot detection on datacenter IPs.
 */

const fs = require("fs");
const path = require("path");

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
 * Load YouTube cookies from cookies.txt (Netscape format)
 * and return them as a Cookie header string.
 */
const loadCookieString = () => {
  const cookiePath = path.join(__dirname, "../cookies.txt");
  if (!fs.existsSync(cookiePath)) return "";

  const content = fs.readFileSync(cookiePath, "utf-8");
  const cookies = content
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split("\t");
      if (parts.length >= 7) {
        return `${parts[5]}=${parts[6]}`;
      }
      return null;
    })
    .filter(Boolean);

  return cookies.join("; ");
};

/**
 * Create a custom fetch function that injects YouTube cookies
 * into every request. This makes datacenter requests look like
 * an authenticated browser session.
 */
const createCookieFetch = (cookieString) => {
  return async (url, init = {}) => {
    const headers = {
      ...init.headers,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    };

    // Add cookies if available
    if (cookieString) {
      headers["Cookie"] = cookieString;
    }

    return fetch(url, {
      ...init,
      headers,
    });
  };
};

/**
 * Main export: get transcript from a YouTube URL.
 * Uses youtube-transcript with cookie-authenticated fetch
 * to bypass bot detection on Render/datacenter IPs.
 */
const getTranscript = async (url) => {
  const { YoutubeTranscript } = await import("youtube-transcript");

  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  console.log(`📝 Fetching captions for video: ${videoId}`);

  const cookieString = loadCookieString();
  if (cookieString) {
    console.log("🍪 YouTube cookies loaded — using authenticated session");
  } else {
    console.log("⚠️ No YouTube cookies found — requests may be blocked on datacenter IPs");
  }

  const customFetch = createCookieFetch(cookieString);

  try {
    // Try English captions first
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
      fetch: customFetch,
    });

    const text = transcript
      .map((segment) => segment.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (text && text.length >= 20) {
      console.log(`✅ Got ${text.length} chars of English transcript`);
      return text;
    }
    throw new Error("Transcript too short");
  } catch (firstError) {
    // If English fails, try without specifying language
    try {
      console.log("⚠️ English captions failed, trying default language...");
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        fetch: customFetch,
      });

      const text = transcript
        .map((segment) => segment.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (text && text.length >= 20) {
        console.log(`✅ Got ${text.length} chars of transcript (default language)`);
        return text;
      }
      throw new Error("Transcript too short");
    } catch (secondError) {
      console.error("YouTube transcript error:", firstError.message);
      throw new Error(firstError.message);
    }
  }
};

module.exports = { getTranscript, extractVideoId };
