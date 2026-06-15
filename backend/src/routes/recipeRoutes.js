const express = require("express");
const router = express.Router();

const { generateRecipe, ingredientQuery } = require("../controllers/recipeController");

// test route
router.get("/", (req, res) => {
  res.send("Recipe route working ✅");
});

// main route
router.post("/generate", generateRecipe);
router.post("/query", ingredientQuery);

module.exports = router;

