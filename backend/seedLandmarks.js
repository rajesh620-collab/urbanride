const mongoose = require('mongoose');
require('dotenv').config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const Landmark = require('./models/Landmark');

    const landmarks = [
      // Hyderabad landmarks with real coordinates
      { name: 'MGBS Bus Stand',       city: 'Hyderabad', category: 'bus_stand', lat: 17.3784, lng: 78.4866 },
      { name: 'Secunderabad Station', city: 'Hyderabad', category: 'railway',   lat: 17.4344, lng: 78.5013 },
      { name: 'Hitech City Metro',    city: 'Hyderabad', category: 'metro',     lat: 17.4474, lng: 78.3808 },
      { name: 'Ameerpet Metro',       city: 'Hyderabad', category: 'metro',     lat: 17.4375, lng: 78.4483 },
      { name: 'LB Nagar Metro',       city: 'Hyderabad', category: 'metro',     lat: 17.3488, lng: 78.5571 },
      { name: 'Kukatpally Metro',     city: 'Hyderabad', category: 'metro',     lat: 17.4849, lng: 78.4138 },
      { name: 'Dilsukhnagar Metro',   city: 'Hyderabad', category: 'metro',     lat: 17.3687, lng: 78.5275 },
      { name: 'Uppal Metro',          city: 'Hyderabad', category: 'metro',     lat: 17.3986, lng: 78.5558 },
      { name: 'Miyapur Metro',        city: 'Hyderabad', category: 'metro',     lat: 17.4969, lng: 78.3551 },
      { name: 'Raidurg Metro',        city: 'Hyderabad', category: 'metro',     lat: 17.4442, lng: 78.3752 },
      { name: 'Jubilee Hills Check Post Metro', city: 'Hyderabad', category: 'metro', lat: 17.4348, lng: 78.4216 },
      { name: 'Begumpet Metro',       city: 'Hyderabad', category: 'metro',     lat: 17.4357, lng: 78.4588 },
      { name: 'Tarnaka Metro',        city: 'Hyderabad', category: 'metro',     lat: 17.4248, lng: 78.5414 },
      { name: 'Inorbit Mall',         city: 'Hyderabad', category: 'mall',      lat: 17.4348, lng: 78.3861 },
      { name: 'Nexus Hyderabad Mall', city: 'Hyderabad', category: 'mall',      lat: 17.4844, lng: 78.3888 },
      { name: 'Sarath City Capital Mall', city: 'Hyderabad', category: 'mall',   lat: 17.4582, lng: 78.3653 },
      { name: 'GVK One Mall',         city: 'Hyderabad', category: 'mall',      lat: 17.4194, lng: 78.4482 },
      { name: 'City Centre Mall',     city: 'Hyderabad', category: 'mall',      lat: 17.4168, lng: 78.4484 },
      { name: 'BVRIT College',        city: 'Narsapur',  category: 'college',   lat: 17.5427, lng: 78.2770 },
      { name: 'Narsapur Bus Stand',   city: 'Narsapur',  category: 'bus_stand', lat: 17.5332, lng: 78.2671 },
      { name: 'Patancheru',           city: 'Hyderabad', category: 'bus_stand', lat: 17.5326, lng: 78.2642 },
      { name: 'Gachibowli',           city: 'Hyderabad', category: 'bus_stand', lat: 17.4401, lng: 78.3489 },
      { name: 'Paradise',             city: 'Hyderabad', category: 'bus_stand', lat: 17.4416, lng: 78.4828 },
      { name: 'Koti',                 city: 'Hyderabad', category: 'bus_stand', lat: 17.3850, lng: 78.4867 },
      { name: 'Charminar',            city: 'Hyderabad', category: 'landmark',  lat: 17.3616, lng: 78.4747 },
      { name: 'Tank Bund',            city: 'Hyderabad', category: 'landmark',  lat: 17.4138, lng: 78.4815 },
    ];

    await Landmark.deleteMany({});
    await Landmark.insertMany(landmarks);
    console.log(`✅ ${landmarks.length} landmarks seeded with coordinates`);

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();