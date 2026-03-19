const mongoose = require("mongoose");

const landmarkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['bus_stand', 'metro', 'railway', 'college', 'airport', 'other'],
    default: 'other'
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  }
});

// 2dsphere index for geospatial queries
landmarkSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model("Landmark", landmarkSchema);