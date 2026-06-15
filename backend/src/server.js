const express = require("express");
const cors = require("cors");
require("dotenv").config();

const recipeRoutes = require("./routes/recipeRoutes");

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

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
