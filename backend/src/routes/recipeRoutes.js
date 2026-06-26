const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");



const { generateRecipe, ingredientQuery, getHistory, saveRecipe, ragQuery } = require("../controllers/recipeController");

// test route
router.get("/", (req, res) => {
  res.send("Recipe route working ✅");
});
router.get("/history", authMiddleware, getHistory);
// main route
router.post("/generate", authMiddleware, generateRecipe);
router.post("/save", authMiddleware, saveRecipe);
router.post("/query", authMiddleware, ingredientQuery);
router.post("/rag", authMiddleware, ragQuery);

module.exports = router;

