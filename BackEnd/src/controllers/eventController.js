const Event = require('../models/Event');

// POST - create an event 

exports.createEvent = async (req, res) => {
    try {
        const { name, type, startDate, endDate, trackId, notes } = req.body;
        if (!name || !type || !startDate || !endDate) {
            return res.status(400).json({ message: 'Name, Type, Start Date and End Date are required' });
        }

        const organisationId = req.user.organisationId;

        const event = await Event.create({
            organisationId,
            name,
            type,
            startDate,
            endDate,
            trackId: trackId || null,
            notes: notes || '',
        });

        res.status(201).json({ event });
    } catch (err) {
        console.error('createEvent error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET Events:

exports.getEvents = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { status } = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (status) {
            filter.status = status;
        }

        const events = await Event.find(filter).sort({ startDate: 1 });
        res.json({ events });
    } catch (err) {
        console.error('getEvents error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET event by ID:

exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const event = await Event.findOne({
            _id: id,
            organisationId,
            isActive: true,
        });

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ event });
    } catch (err) {
        console.error('get EventById error', err);
        res.status(500).json({message: 'Server error'})
    }
}

// Update event 

exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const event = await Event.findOneAndUpdate(
            { _id: id, organisationId, isActive: true },
            req.body,
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ message: 'Event Not Found' });
        }
        res.json({ event });
    } catch (err) {
        console.error('Update Event error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Archive / delete event 

exports.archiveEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const event = await Event.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false },
            { new: true }
        );
        if (!event) {
            return res.status(404).json({ message: 'Event Not Found' });
        }
        res.json({ message: 'Event Archived', event });
    } catch (err) {
        console.error('Archive event error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Unarchive an event 

exports.unarchiveEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const event = await Event.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true },
            { new: true }
        );
        if (!event) {
            return res.status(404).json({ message: 'Event Not Found' });
        }
        res.json({ message: 'Event Unarchived', event });
    } catch (err) {
        console.error('Unarchive event error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

