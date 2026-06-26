const OpenAI = require("openai");
// const cosineSimilarity = require("../utils/simmilarity");
const mongoose = require("mongoose");



const { getTranscriptFromVideo, convertTranscript } = require("../services/aiService");
const Recipe = require("../models/recipe");


// Groq client (same as aiService)
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// OpenRouter client
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
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
const saveRecipe = async (req, res) => {
  try {
    const { url, recipe } = req.body;

    const existing = await Recipe.findOne({
      userId: req.user.id,
      url
    });

    if (existing) {
      return res.json({
        message: "Recipe already saved",
        existing,
      });
    }
    // create embedding text
    const ingredientsText = recipe.ingredients
      .map(i => i.name)
      .join(", ");

    const embeddingText = `
${recipe.title}
Ingredients: ${ingredientsText}
`;

    // get embedding (IMPORTANT: use openrouter client)
    const embeddingRes = await openrouter.embeddings.create({
      model: "text-embedding-3-small",
      input: embeddingText,
    });
    // console.log(embeddingRes, "embeddingRes");
    const embedding = embeddingRes.data[0].embedding;


    const newRecipe = await Recipe.create({
      userId: req.user.id,
      url,
      title: recipe.title,
      embedding,
      embeddingText,
      recipe,
    });

    res.json({
      message: "Recipe saved ",
      newRecipe,
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

const getHistory = async (req, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const ragQuery = async (req, res) => {
  try {
    const { query, mode } = req.body;

    // 🔥 1. create embedding for user query
    const queryEmbeddingRes = await openrouter.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryEmbedding = queryEmbeddingRes.data[0].embedding;


    //  get all user recipes
    // const recipes = await Recipe.find({ userId: req.user.id });

    // console.log("Query embedding length:", queryEmbedding.length);

    // recipes.forEach(r => {
    //   console.log("Recipe embedding length:", r.embedding?.length);
    // });




    // // compute similarity
    // const scored = recipes.map(r => ({
    //   _id: r._id,
    //   title: r.title,
    //   recipe: r.recipe,
    //   embedding: r.embedding,
    //   embeddingText: r.embeddingText,
    //   score: cosineSimilarity(queryEmbedding, r.embedding),
    // }));
    // console.log("Query:", query);
    // console.log("Scores:", scored.map(r => ({
    //   title: r.title,
    //   score: r.score
    // })));

    // //  sort + pick top 3
    // const topRecipes = scored
    //   .sort((a, b) => b.score - a.score)
    //   .slice(0, 3)
    //   .map(r => ({
    //     _id: r._id,
    //     title: r.title || "Untitled Recipe",
    //     score: r.score,
    //     recipe: r.recipe,
    //     ingredients: r.recipe?.ingredients || [],
    //     embeddingText: r.embeddingText
    //   }));

    //using mongodb vector search (improved)

    const candidates = await Recipe.aggregate([
      {
        $vectorSearch: {
          index: "recipe_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 20,
        },
      },
      {
        $project: {
          userId: 1,
          title: 1,
          recipe: 1,
          embeddingText: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
    // console.log(
    //   candidates.map(c => ({
    //     title: c.title,
    //     userId: c.userId.toString(),
    //     score: c.score
    //   }))
    // );
    // console.log(req.user.id, "user");
    // console.log(req.user);
    // console.log(candidates);
    const topRecipes = candidates.filter(
      r => r.userId.toString() === req.user.id.toString()
    ).slice(0, 3);




    // 🟢 MODE 1: suggest only
    if (mode === "suggest") {
      return res.json({ recipes: topRecipes });
    }

    // 🔥 MODE 2: generate a full structured recipe using RAG context
    const context = topRecipes.map(r => {
      const ingredients = (r.recipe?.ingredients || [])
        .map(i => i.name)
        .join(", ");

      const style = r.recipe?.steps?.[0] || "";

      return `
Title: ${r.title}
Ingredients: ${ingredients}
Style: ${style}
`;
    }).join("\n");

    const prompt = `
You are a cooking assistant. The user wants: "${query}"

Here are some of their past recipes for reference (use these for personalization):
${context}

Generate a COMPLETE NEW recipe based on what the user wants.
Use the past recipes only as inspiration for their taste preferences.

Return a structured recipe with:
1. Ingredients (with: name, quantity, emoji, fat, protein, carbs, vitamins, purpose, alternatives, skippable, impact)
2. Title: A short, clean recipe name (2–5 words). No emojis, no hype words.
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
`;

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const generatedRecipe = JSON.parse(completion.choices[0].message.content);

    res.json({
      recipe: generatedRecipe,
      recipes: topRecipes,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = { generateRecipe, ingredientQuery, getHistory, saveRecipe, ragQuery };
