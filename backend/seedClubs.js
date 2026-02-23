const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define schema matching the actual Organizer model in models/organizer.js
const organizerSchema = new mongoose.Schema({
    organizerName: { type: String, required: true },
    category: { type: String, required: true, enum: ['Club', 'Council', 'Fest Team', 'Other'] },
    description: { type: String, required: true },
    contactEmail: { type: String, required: true, unique: true },
    contactNumber: { type: String },
    password: { type: String, required: true },
    isApproved: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Organizer = mongoose.model('Organizer', organizerSchema);

const clubs = [
    {
        organizerName: 'Programming Club',
        category: 'Club',
        contactEmail: 'progclub@iiit.ac.in',
        contactNumber: '9876543210',
        description: 'Coding competitions, hackathons, and technical workshops',
        password: 'club123'
    },
    {
        organizerName: 'DebSoc',
        category: 'Club',
        contactEmail: 'debsoc@iiit.ac.in',
        contactNumber: '9876543211',
        description: 'Debate society - Parliamentary debates, MUNs, and public speaking events',
        password: 'club123'
    },
    {
        organizerName: 'ArtSoc',
        category: 'Club',
        contactEmail: 'artsoc@iiit.ac.in',
        contactNumber: '9876543212',
        description: 'Art and design club - Exhibitions, workshops, and creative events',
        password: 'club123'
    },
    {
        organizerName: 'Amateur Sports Enthusiasts Club',
        category: 'Club',
        contactEmail: 'asec@iiit.ac.in',
        contactNumber: '9876543213',
        description: 'Sports and fitness activities for all skill levels',
        password: 'club123'
    },
    {
        organizerName: 'Chess Club',
        category: 'Club',
        contactEmail: 'chess@iiit.ac.in',
        contactNumber: '9876543214',
        description: 'Chess tournaments, training sessions, and strategy workshops',
        password: 'club123'
    }
];

async function seedClubs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Delete all existing organizers
        const deleted = await Organizer.deleteMany({});
        console.log(`Cleared ${deleted.deletedCount} existing organizers`);

        // Hash passwords and insert
        for (const club of clubs) {
            const hashedPassword = await bcrypt.hash(club.password, 10);
            await Organizer.create({
                ...club,
                password: hashedPassword
            });
            console.log(`✓ Created: ${club.organizerName}`);
        }

        console.log('\n✅ All 5 clubs created successfully!');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

seedClubs();
