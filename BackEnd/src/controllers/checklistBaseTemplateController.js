const ChecklistBaseTemplate = require('../models/ChecklistBaseTemplate');

// POST - create a base checklist template

exports.createChecklistBaseTemplate = async (req, res) => {
    try {
        const {
            name,
            category,
            appliesTo,
            description,
            items,
        } = req.body;

        if (!name || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Name and at least one checklist item are required',
            });
        }

        const checklistBaseTemplate = await ChecklistBaseTemplate.create({
            name,
            category: category || 'general',
            appliesTo: appliesTo || 'general',
            description: description || '',
            items,
        });

        res.status(201).json({ checklistBaseTemplate });
    } catch (err) {
        console.error('createChecklistBaseTemplate error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET - all base checklist templates

exports.getChecklistBaseTemplates = async (req, res) => {
    try {
        const { category, appliesTo } = req.query;

        const filter = {
            isActive: true,
        };

        if (category) filter.category = category;
        if (appliesTo) filter.appliesTo = appliesTo;

        const checklistBaseTemplates = await ChecklistBaseTemplate.find(filter)
            .sort({ createdAt: -1 });

        res.json({ checklistBaseTemplates });
    } catch (err) {
        console.error('getChecklistBaseTemplates error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET - base checklist template by ID

exports.getChecklistBaseTemplateById = async (req, res) => {
    try {
        const { id } = req.params;

        const checklistBaseTemplate = await ChecklistBaseTemplate.findOne({
            _id: id,
            isActive: true,
        });

        if (!checklistBaseTemplate) {
            return res.status(404).json({ message: 'Checklist base template not found' });
        }

        res.json({ checklistBaseTemplate });
    } catch (err) {
        console.error('getChecklistBaseTemplateById error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH - update base checklist template

exports.updateChecklistBaseTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const checklistBaseTemplate = await ChecklistBaseTemplate.findOneAndUpdate(
            { _id: id, isActive: true },
            req.body,
            { new: true, runValidators: true }
        );

        if (!checklistBaseTemplate) {
            return res.status(404).json({ message: 'Checklist base template not found' });
        }

        res.json({ checklistBaseTemplate });
    } catch (err) {
        console.error('updateChecklistBaseTemplate error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE - archive base checklist template

exports.archiveChecklistBaseTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const checklistBaseTemplate = await ChecklistBaseTemplate.findOneAndUpdate(
            { _id: id },
            { isActive: false },
            { new: true }
        );

        if (!checklistBaseTemplate) {
            return res.status(404).json({ message: 'Checklist base template not found' });
        }

        res.json({
            message: 'Checklist base template archived',
            checklistBaseTemplate,
        });
    } catch (err) {
        console.error('archiveChecklistBaseTemplate error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH - unarchive base checklist template

exports.unarchiveChecklistBaseTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const checklistBaseTemplate = await ChecklistBaseTemplate.findOneAndUpdate(
            { _id: id },
            { isActive: true },
            { new: true }
        );

        if (!checklistBaseTemplate) {
            return res.status(404).json({ message: 'Checklist base template not found' });
        }

        res.json({
            message: 'Checklist base template unarchived',
            checklistBaseTemplate,
        });
    } catch (err) {
        console.error('unarchiveChecklistBaseTemplate error', err);
        res.status(500).json({ message: 'Server error' });
    }
};