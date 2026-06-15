const OpenAI = require("openai");

const { getTranscriptFromVideo, convertTranscript } = require("../services/aiService");

// Groq client (same as aiService)
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});


// Generate Recipe
const generateRecipe = async (req, res) => {
  try {
    const { url } = req.body;

    const transcript = await getTranscriptFromVideo(url);
    const recipe = await convertTranscript(transcript);

    res.json({
      message: "Recipe generated ✅",
      recipe,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Ingredient Q&A (NEW)
const ingredientQuery = async (req, res) => {
  try {
    const { question, ingredients } = req.body;

    const prompt = `
You are a cooking assistant.

User question: ${question}

Ingredients available:
${JSON.stringify(ingredients)}

Instructions:
- If user is missing an ingredient → suggest alternatives
- If asking purpose → explain briefly
- Keep answer short, clear, and practical
`;

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    const answer = completion.choices[0].message.content;

    res.json({ answer });

  } catch (error) {
    console.error("Query Error:", error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = { generateRecipe, ingredientQuery };
