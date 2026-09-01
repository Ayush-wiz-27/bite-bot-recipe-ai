require("dotenv").config();
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
async function test() {
  try {
    const res = await openai.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: "Hello" }]
    });
    console.log("Groq success!", res.choices[0].message.content);
  } catch (err) {
    console.error("Groq error:", err.message);
  }
}
test();
