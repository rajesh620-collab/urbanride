const mongoose = require("mongoose");

const landmarkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  category: {
    type: String
  }
});

module.exports = mongoose.model("Landmark", landmarkSchema);