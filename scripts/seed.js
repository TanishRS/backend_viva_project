/**
 * Seeds the database with demo data matching the case study's
 * "Example User Flow" so the API can be smoke-tested end-to-end.
 * Run with: npm run seed
 */
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const Need = require('../models/Need');
const Donation = require('../models/Donation');
const ReliefCamp = require('../models/ReliefCamp');
const Alert = require('../models/Alert');

async function seed() {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Volunteer.deleteMany({}),
    Need.deleteMany({}),
    Donation.deleteMany({}),
    ReliefCamp.deleteMany({}),
    Alert.deleteMany({}),
  ]);

  console.log('Creating users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@reliefconnect.org',
    password: 'password123',
    role: 'admin',
  });
  const ngo = await User.create({
    name: 'Mumbai Relief NGO',
    email: 'ngo@reliefconnect.org',
    password: 'password123',
    role: 'ngo',
    isVerified: true,
  });
  const volunteerUser = await User.create({
    name: 'Riya Sharma',
    email: 'volunteer@reliefconnect.org',
    password: 'password123',
    role: 'volunteer',
  });
  const donor = await User.create({
    name: 'Aman Gupta',
    email: 'donor@reliefconnect.org',
    password: 'password123',
    role: 'donor',
  });

  console.log('Creating volunteer profile...');
  await Volunteer.create({
    user: volunteerUser._id,
    skills: ['Medical aid'],
    availability: 'tomorrow',
    availabilityNote: 'Medical aid, available tomorrow',
    location: { type: 'Point', coordinates: [72.8777, 19.076], address: 'Mumbai' },
  });

  console.log('Creating relief camps...');
  const camps = await ReliefCamp.insertMany(
    [1, 2, 3, 4, 5].map((i) => ({
      name: `Relief Camp ${i}`,
      managedBy: admin._id,
      location: { type: 'Point', coordinates: [72.87 + i * 0.01, 19.07 + i * 0.01], address: `Zone ${i}, Mumbai` },
      capacity: 200,
      currentOccupancy: 50 * i,
      status: 'active',
    }))
  );

  console.log('Creating a need (NGO posts)...');
  const need = await Need.create({
    postedBy: ngo._id,
    title: '500 blankets, 200 food packets needed',
    description: 'Urgent relief supplies needed for flood-affected families',
    category: 'food',
    items: [
      { name: 'Blankets', quantity: 500, unit: 'pcs' },
      { name: 'Food packets', quantity: 200, unit: 'pcs' },
    ],
    urgency: 'high',
    location: { type: 'Point', coordinates: [72.88, 19.08], zoneName: 'Flood Zone A', address: 'Zone A, Mumbai' },
  });

  console.log('Creating a donation...');
  await Donation.create({
    donor: donor._id,
    type: 'funds',
    amount: 10000,
    relatedNeed: need._id,
    note: 'Contribution for relief supplies',
  });

  console.log('Admin verifies the need...');
  need.status = 'verified';
  need.verifiedBy = admin._id;
  need.verifiedAt = new Date();
  await need.save();

  console.log('Admin sends an emergency alert...');
  await Alert.create({
    title: 'Cyclone Warning',
    message: 'Cyclone approaching, prepare shelters',
    severity: 'emergency',
    isEmergency: true,
    affectedArea: { zoneName: 'Flood Zone A' },
    createdBy: admin._id,
  });

  console.log('\nSeed complete. Demo accounts (password: password123):');
  console.log(`  Admin:     ${admin.email}`);
  console.log(`  NGO:       ${ngo.email}`);
  console.log(`  Volunteer: ${volunteerUser.email}`);
  console.log(`  Donor:     ${donor.email}`);
  console.log(`\nCreated ${camps.length} relief camps, 1 need, 1 donation, 1 emergency alert.`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
