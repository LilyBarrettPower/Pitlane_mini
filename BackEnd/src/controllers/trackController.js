const Track = require('../models/Track');

// POST - create a track

exports.createTrack = async (req, res) => {
    try {
        const { name, distanceKms, country, notes } = req.body;
        if (!name || !country ) {
            return res.status(400).json({ message: 'Name and country are required' });
        }

        const organisationId = req.user.organisationId;

        const track = await Track.create({
            organisationId,
            name,
            distanceKms: distanceKms ?? null,
            country,
            notes: notes || '',
        });

        res.status(201).json({ track });
    } catch (err) {
        console.error('createTrack error:', err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Track name already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// GET Tracks:

exports.getTracks = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { country } = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (country) {
            filter.country = country;
        }

        const tracks = await Track.find(filter).sort({ name: 1 });
        res.json({ tracks });
    } catch (err) {
        console.error('getTracks error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET track by ID:

exports.getTrackById = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;
        

        const track = await Track.findOne({
            _id: id,
            organisationId
        });

        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }

        res.json({ track });
    } catch (err) {
        console.error('get TrackById error', err);
        res.status(500).json({ message: 'Server error' })
    }
}

// Update event 

exports.updateTrack = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;


        const track = await Track.findOneAndUpdate(
            { _id: id, organisationId, isActive: true },
            req.body,
            { new: true }
        );

        if (!track) {
            return res.status(404).json({ message: 'Track Not Found' });
        }
        res.json({ track});
    } catch (err) {
        console.error('Update Track error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Archive / delete event 

exports.archiveTrack = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const track = await Track.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false },
            { new: true }
        );
        if (!track) {
            return res.status(404).json({ message: 'Track Not Found' });
        }
        res.json({ message: 'Track Archived', track });
    } catch (err) {
        console.error('Archive track error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Unarchive an event 

exports.unarchiveTrack = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const track = await Track.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true },
            { new: true }
        );
        if (!track) {
            return res.status(404).json({ message: 'Track Not Found' });
        }
        res.json({ message: 'Track Unarchived', track });
    } catch (err) {
        console.error('Unarchive track error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};