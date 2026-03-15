const express = require("express");
const router = express.Router();
const Landmark = require("../models/Landmark");

router.get("/", async (req, res) => {
  try {
    const landmarks = await Landmark.find().sort({ name: 1 });
    res.json({ landmarks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;