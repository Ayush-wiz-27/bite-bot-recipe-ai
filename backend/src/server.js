const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Decode YouTube cookies from Render environment variable
if (process.env.YT_COOKIES_B64) {
  try {
    let decoded = Buffer.from(process.env.YT_COOKIES_B64, "base64").toString("utf-8");
    if (!decoded.startsWith("# Netscape HTTP Cookie File")) {
      decoded = "# Netscape HTTP Cookie File\n" + decoded;
    }
    fs.writeFileSync(path.join(__dirname, "cookies.txt"), decoded);
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

// Trust proxy is required if you are behind a reverse proxy (like Render/Vercel)
// so that the IP address is read correctly for rate limiting.
app.set("trust proxy", 1);

// Global Rate Limiter: Max 100 requests per 15 minutes for general endpoints
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Rate Limiter: Max 10 requests per hour for Recipe Generation
// (To protect your free Supadata & Groq API quotas from abuse)
const recipeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "Daily recipe limit reached for this IP. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Routes
// Apply the strict recipe limiter specifically to the recipe generation endpoints
app.use("/api/recipe", recipeLimiter, recipeRoutes);

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
