const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Event = require('./models/event');
const Organizer = require('./models/organizer');

const seedEvents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // find or create organizer
        let organizer = await Organizer.findOne();
        if (!organizer) {
            const hashedPassword = await bcrypt.hash('organizer123', 10);
            organizer = await Organizer.create({
                organizerName: 'Tech Club IIIT',
                category: 'Club',
                description: 'Technical club organizing events',
                contactEmail: 'techclub@iiit.ac.in',
                password: hashedPassword
            });
            console.log('Created organizer');
        }

        // clear existing events
        await Event.deleteMany({});
        console.log('Cleared existing events');

        // create test events
        const events = [
            {
                name: 'CodeCrunch 2026',
                description: 'Annual competitive programming contest featuring algorithmic challenges and real-time problem solving. Test your coding skills against the best programmers!',
                eventType: 'Normal',
                eligibility: 'All',
                startDate: new Date('2026-02-13T10:00:00'),
                endDate: new Date('2026-02-13T18:00:00'),
                locationOfEvent: 'Vindhya Lab',
                maxParticipants: 100,
                participationFee: 0,
                registrationDeadline: new Date('2026-02-12T23:59:59'),
                status: 'published',
                organizerId: organizer._id,
                customFormFields: [
                    { fieldName: 'Programming Language', fieldType: 'text', required: true },
                    { fieldName: 'Team Name', fieldType: 'text', required: false }
                ]
            },
            {
                name: 'Tech Fest Merchandise',
                description: 'Official Tech Fest 2026 merchandise including t-shirts, hoodies, and stickers. Limited edition designs available in multiple sizes and colors.',
                eventType: 'Merchandise',
                eligibility: 'All',
                startDate: new Date('2026-02-13T09:00:00'),
                endDate: new Date('2026-02-16T20:00:00'),
                locationOfEvent: 'Student Activity Center',
                maxParticipants: 500,
                participationFee: 0,
                status: 'published',
                organizerId: organizer._id,
                variants: [
                    { variantName: 'T-Shirt (S)', price: 299, stock: 50 },
                    { variantName: 'T-Shirt (M)', price: 299, stock: 100 },
                    { variantName: 'T-Shirt (L)', price: 299, stock: 80 },
                    { variantName: 'Hoodie (M)', price: 799, stock: 30 },
                    { variantName: 'Hoodie (L)', price: 799, stock: 25 }
                ]
            },
            {
                name: 'AI Workshop Series',
                description: 'Three-day intensive workshop on Machine Learning and Deep Learning. Hands-on sessions with industry experts covering neural networks, computer vision, and NLP.',
                eventType: 'Normal',
                eligibility: 'IIIT Only',
                startDate: new Date('2026-02-14T14:00:00'),
                endDate: new Date('2026-02-16T17:00:00'),
                locationOfEvent: 'Himalaya Seminar Hall',
                maxParticipants: 60,
                participationFee: 500,
                registrationDeadline: new Date('2026-02-13T18:00:00'),
                status: 'published',
                organizerId: organizer._id,
                customFormFields: [
                    { fieldName: 'Prior ML Experience', fieldType: 'text', required: true },
                    { fieldName: 'Laptop Available', fieldType: 'text', required: true }
                ]
            },
            {
                name: 'Gaming Tournament',
                description: 'Esports tournament featuring Valorant, CS:GO, and FIFA. Cash prizes for winners! Team registrations open for competitive gaming enthusiasts.',
                eventType: 'Normal',
                eligibility: 'All',
                startDate: new Date('2026-02-15T10:00:00'),
                endDate: new Date('2026-02-15T22:00:00'),
                locationOfEvent: 'Felicity Ground',
                maxParticipants: 200,
                participationFee: 100,
                registrationDeadline: new Date('2026-02-14T20:00:00'),
                status: 'published',
                organizerId: organizer._id,
                customFormFields: [
                    { fieldName: 'Game Choice', fieldType: 'text', required: true },
                    { fieldName: 'Team Members', fieldType: 'text', required: true },
                    { fieldName: 'Gaming ID', fieldType: 'text', required: true }
                ]
            },
            {
                name: 'Felicity Combo Pack',
                description: 'Special combo pack including event pass, merchandise, and food coupons. Best value deal for the entire fest! Limited quantities available.',
                eventType: 'Merchandise',
                eligibility: 'All',
                startDate: new Date('2026-02-13T08:00:00'),
                endDate: new Date('2026-02-16T23:59:59'),
                locationOfEvent: 'Main Gate Stall',
                maxParticipants: 300,
                participationFee: 0,
                status: 'published',
                organizerId: organizer._id,
                variants: [
                    { variantName: 'Basic Pack', price: 499, stock: 100 },
                    { variantName: 'Premium Pack', price: 999, stock: 50 },
                    { variantName: 'VIP Pack', price: 1999, stock: 20 }
                ]
            }
        ];

        await Event.insertMany(events);
        console.log(`Created ${events.length} test events`);
        console.log('Event dates: Feb 13-16, 2026');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding events:', error);
        process.exit(1);
    }
};

seedEvents();
