const fs = require("fs");
const path = require("path");

const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const OpenAI = require("openai");

ffmpeg.setFfmpegPath(ffmpegPath);

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

const youtubedl = require('youtube-dl-exec');

const downloadAudio = async (url, outputPath) => {
  const isInstagram = url.includes("instagram.com") || url.includes("instagr.am");

  const options = {
    extractAudio: true,
    audioFormat: 'mp3',
    ffmpegLocation: ffmpegPath,
    output: outputPath,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    extractorArgs: 'youtube:player_client=android,web', // This is the magic line to bypass bot detection
    addHeader: [
      `referer:${isInstagram ? 'instagram.com' : 'youtube.com'}`,
      'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    ]
  };

  return youtubedl(url, options);
};

const transcribeAudio = async (filePath) => {
  try {
    // Primary: whisper-large-v3-turbo (Fast & High Limit)
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3-turbo",
    });
    return response.text;
  } catch (error) {
    if (error.status === 429) {
      // Fallback: whisper-large-v3 (Solid but stricter limits)
      try {
        const response = await openai.audio.transcriptions.create({
          file: fs.createReadStream(filePath),
          model: "whisper-large-v3",
        });
        return response.text;
      } catch (fallbackError) {
        throw new Error("Bite Bot is currently saturated. Please wait 60 seconds.");
      }
    }
    throw new Error(`Whisper failed: ${error.message}`);
  }
};

const getTranscriptFromVideo = async (url) => {
  try {
    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const outputPath = path.join(tempDir, `audio_${Date.now()}.mp3`);
    await downloadAudio(url, outputPath);

    const transcript = await transcribeAudio(outputPath);

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    return transcript;

  } catch (error) {
    console.error("Transcription pipeline error:", error.message);
    throw error;
  }
};

const convertTranscript = async (transcript) => {
  try {
    const prompt = `
You are a cooking assistant.

Identify if this is a high-velocity Social Media Reel/Short or a long-form Masterclass.
Extract the recipe accordingly.

From the following transcript, extract:
1. Ingredients (with:
   - name
   - quantity
   - emoji (Contextual emoji like 🥩, 🧅, etc.)
   - fat (e.g., "5g")
   - protein (e.g., "20g")
   - carbs (e.g., "2g")
   - vitamins (Identify 1-2 key vitamins like "Vit C, Vit A")
   - purpose
   - alternatives
   - skippable
   - impact)
2.Title:
- A short, clean recipe name along with who is the creator of this video (2–5 words)
- No emojis, no hype words like "best", "ultimate"
- Example: "Butter Chicken by [CREATOR NAME]", "Paneer Tikka by [CREATOR NAME]", "Masala Omelette by [CREATOR NAME]"
3. Steps (clear, short, ordered)

Return ONLY valid JSON in this format:
{
  "title": "",
  "ingredients": [
    {
      "name": "",
      "quantity": "",
      "emoji": "",
      "fat": "",
      "protein": "",
      "carbs": "",
      "vitamins": "",
      "purpose": "",
      "alternatives": [],
      "skippable": true,
      "impact": ""
    }
  ],
  "steps": []
}


Transcript:
${transcript}
`;

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // handles randomness
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (err) {
    console.error("AI ERROR:", err);
    return null;
  }
};

const { getTranscript } = require("./youtubeService");

// SMART FALLBACK: Tries to get captions directly first (bypasses yt-dlp bot detection completely)
const getTranscriptSmart = async (url) => {
  try {
    const captionText = await getTranscript(url);
    if (captionText && captionText.length > 20) {
      console.log("✅ Successfully extracted captions directly (bypassed yt-dlp)!");
      return captionText;
    }
    throw new Error("Captions too short");
  } catch (err) {
    console.warn("⚠️ Captions unavailable, falling back to yt-dlp:", err.message);
    const audioTranscript = await getTranscriptFromVideo(url);

    if (audioTranscript && audioTranscript.length > 20) {
      return audioTranscript;
    }

    throw new Error("Failed to extract transcript from video");
  }
};

module.exports = { getTranscriptFromVideo, convertTranscript, getTranscriptSmart };
