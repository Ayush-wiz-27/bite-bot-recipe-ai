require("dotenv").config();
const OpenAI = require("openai");
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});
async function test() {
  try {
    console.log("Testing OpenRouter...");
    const res = await openrouter.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: "Hello" }]
    });
    console.log("OpenRouter success!", res.choices[0].message.content);
  } catch (err) {
    console.error("OpenRouter error:", err.message);
  }
}
test();
