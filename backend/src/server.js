const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Decode YouTube cookies from Render environment variable
if (process.env.YT_COOKIES_B64) {
  try {
    fs.writeFileSync(
      path.join(__dirname, "cookies.txt"),
      Buffer.from(process.env.YT_COOKIES_B64, "base64").toString("utf-8")
    );
    console.log("✅ YouTube cookies securely loaded from environment variables");
  } catch (err) {
    console.error("Failed to parse YT_COOKIES_B64", err);
  }
}

const recipeRoutes = require("./routes/recipeRoutes");
const authRoutes = require('./routes/authRoutes');

const app = express();


// Middleware


app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://bite-bot-recipe-ai.vercel.app"
  ],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/recipe", recipeRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 8000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
