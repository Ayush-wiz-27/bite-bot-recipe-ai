const axios = require("axios");

const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const INNERTUBE_BASE = "https://www.youtube.com/youtubei/v1";

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
 * Fetches captions using YouTube's InnerTube API.
 * This is the same API YouTube's own web player uses,
 * so it doesn't trigger bot detection from datacenter IPs.
 */
const getCaptionsViaInnerTube = async (videoId) => {
  // Step 1: Get player response with caption tracks
  const playerRes = await axios.post(
    `${INNERTUBE_BASE}/player?key=${INNERTUBE_API_KEY}`,
    {
      context: {
        client: {
          hl: "en",
          gl: "US",
          clientName: "WEB",
          clientVersion: "2.20240101.00.00",
        },
      },
      videoId,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    }
  );

  const playerData = playerRes.data;

  // Check if the video is playable
  const playabilityStatus = playerData?.playabilityStatus?.status;
  if (playabilityStatus === "ERROR") {
    throw new Error("Video not available");
  }
  if (playabilityStatus === "LOGIN_REQUIRED") {
    throw new Error("Video requires login (age-restricted or private)");
  }

  const captionTracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    throw new Error("No captions available for this video");
  }

  // Step 2: Find the best caption track
  // Priority: English manual > English auto-generated > any manual > any auto-generated
  let selectedTrack = null;

  // Try English manual captions first
  selectedTrack = captionTracks.find(
    (t) => t.languageCode === "en" && t.kind !== "asr"
  );

  // Then English auto-generated
  if (!selectedTrack) {
    selectedTrack = captionTracks.find((t) => t.languageCode === "en");
  }

  // Then any manual captions (Hindi, etc.)
  if (!selectedTrack) {
    selectedTrack = captionTracks.find((t) => t.kind !== "asr");
  }

  // Finally, any available caption track
  if (!selectedTrack) {
    selectedTrack = captionTracks[0];
  }

  // Step 3: Fetch the actual caption content
  let captionUrl = selectedTrack.baseUrl;

  // If the caption is not in English and it's auto-generated,
  // request auto-translation to English
  if (selectedTrack.languageCode !== "en") {
    captionUrl += "&tlang=en";
  }

  // Request as srv1 (simple XML format)
  if (!captionUrl.includes("fmt=")) {
    captionUrl += "&fmt=srv1";
  }

  const captionRes = await axios.get(captionUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  const xml = captionRes.data;

  // Step 4: Parse the XML and extract clean text
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let result = "";
  let match;

  while ((match = textRegex.exec(xml)) !== null) {
    let text = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/<[^>]+>/g, "") // strip any HTML tags
      .replace(/\n/g, " ")
      .trim();

    if (text) {
      result += text + " ";
    }
  }

  return result.trim();
};

/**
 * Main export: get transcript from a YouTube URL.
 * Uses InnerTube API to completely bypass yt-dlp bot detection.
 */
const getTranscript = async (url) => {
  try {
    const videoId = extractVideoId(url);

    if (!videoId) throw new Error("Invalid YouTube URL");

    console.log(`📝 Fetching captions for video: ${videoId} via InnerTube API`);

    const transcript = await getCaptionsViaInnerTube(videoId);

    if (!transcript || transcript.length < 20) {
      throw new Error("Caption transcript too short or empty");
    }

    console.log(
      `✅ Got ${transcript.length} chars of transcript via InnerTube`
    );
    return transcript;
  } catch (error) {
    console.error("InnerTube transcript error:", error.message);
    throw new Error(error.message);
  }
};

module.exports = { getTranscript, extractVideoId };
