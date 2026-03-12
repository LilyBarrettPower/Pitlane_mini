const Issue = require('../models/Issue');

// POST - create an issue

exports.createIssue = async (req, res) => {
    try {

        const organisationId = req.user.organisationId;

        const { eventVehicleId, area, symptoms, severity, cause, fix, status, notes } = req.body;
        if (!eventVehicleId || !area || !symptoms|| !severity) {
            return res.status(400).json({ message: 'EventVehicleId, area, symptoms and severity are required' });
        }
        

        const issue = await Issue.create({
            organisationId,
            eventVehicleId,
            area,
            symptoms,
            severity,
            cause: cause || '',
            fix: fix || '',
            status: status || 'open',
            notes: notes || '',
        });

        res.status(201).json({ issue });
    } catch (err) {
        console.error('createIssue error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET Issue for a specific vehicleEvent:

exports.getIssues = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { eventVehicleId } = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (eventVehicleId) filter.eventVehicleId = eventVehicleId;

        const issues = await Issue.find(filter).sort({ reportedAt: -1 });
        res.json({ issues });
    } catch (err) {
        console.error('getIssues error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET issue by ID:

exports.getIssueById = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const issue = await Issue.findOne({
            _id: id,
            organisationId
        });

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json({ issue });
    } catch (err) {
        console.error('get IssueById error', err);
        res.status(500).json({ message: 'Server error' })
    }
}

// Update issue

exports.updateIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const issue = await Issue.findOneAndUpdate(
            { _id: id, organisationId},
            req.body,
            { new: true }
        );

        if (!issue) {
            return res.status(404).json({ message: 'Issue Not Found' });
        }
        res.json({ issue });
    } catch (err) {
        console.error('Update Issue error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Archive / delete issue

exports.archiveIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const issue = await Issue.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false },
            { new: true }
        );
        if (!issue) {
            return res.status(404).json({ message: 'Issue Not Found' });
        }
        res.json({ message: 'Issue Archived', issue });
    } catch (err) {
        console.error('Archive issue error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Unarchive an issue

exports.unarchiveIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const issue = await Issue.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true },
            { new: true }
        );
        if (!issue) {
            return res.status(404).json({ message: 'Issue Not Found' });
        }
        res.json({ message: 'Issue Unarchived', issue });
    } catch (err) {
        console.error('Unarchive issue error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

