const mongoose = require('mongoose');
const recipeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    url: {
      type: String,
      required: true,
    },
    recipe: {
      type: Object, // full AI response (ingredients + steps etc)
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    embeddingText: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Recipe = mongoose.model("Recipe", recipeSchema);

module.exports = Recipe;