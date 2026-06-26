const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const recipeRoutes = require("./routes/recipeRoutes");
const authRoutes = require('./routes/authRoutes');

const app = express();


// Middleware
app.use(cors({
  origin: "*"
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
