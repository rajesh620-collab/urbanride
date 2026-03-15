const mongoose = require('mongoose');
require('dotenv').config();

// Connect FIRST, then require the model
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Require model AFTER connection is established
    const Landmark = require('./models/Landmark');

    const landmarks = [
      { name: 'MGBS Bus Stand',       city: 'Hyderabad', category: 'bus_stand' },
      { name: 'Secunderabad Station', city: 'Hyderabad', category: 'railway'   },
      { name: 'Hitech City Metro',    city: 'Hyderabad', category: 'metro'     },
      { name: 'Ameerpet Metro',       city: 'Hyderabad', category: 'metro'     },
      { name: 'LB Nagar Metro',       city: 'Hyderabad', category: 'metro'     },
      { name: 'Kukatpally',           city: 'Hyderabad', category: 'bus_stand' },
      { name: 'Dilsukhnagar',         city: 'Hyderabad', category: 'bus_stand' },
      { name: 'Uppal',                city: 'Hyderabad', category: 'bus_stand' },
      { name: 'Miyapur',              city: 'Hyderabad', category: 'metro'     },
      { name: 'BVRIT College',        city: 'Narsapur',  category: 'college'   },
      { name: 'Narsapur Bus Stand',   city: 'Narsapur',  category: 'bus_stand' },
      { name: 'Patancheru',           city: 'Hyderabad', category: 'bus_stand' },
      { name: 'Gachibowli',           city: 'Hyderabad', category: 'bus_stand' },
      { name: 'Paradise',             city: 'Hyderabad', category: 'bus_stand' },
      { name: 'Koti',                 city: 'Hyderabad', category: 'bus_stand' },
    ];

    await Landmark.deleteMany({});
    await Landmark.insertMany(landmarks);
    console.log('✅ Landmarks seeded successfully');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();