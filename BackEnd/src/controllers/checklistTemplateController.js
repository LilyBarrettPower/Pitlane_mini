const ChecklistTemplate = require('../models/ChecklistTemplate');
const ChecklistBaseTemplate = require('../models/ChecklistBaseTemplate');

// POST - create a checklist template from scratch

exports.createChecklistTemplate = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;

        const {
            name,
            category,
            appliesTo,
            description,
            items,
            baseTemplateId,
        } = req.body;

        if (!name || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Name and at least one checklist item are required',
            });
        }

        const checklistTemplate = await ChecklistTemplate.create({
            organisationId,
            baseTemplateId: baseTemplateId || null,
            name,
            category: category || 'general',
            appliesTo: appliesTo || 'general',
            description: description || '',
            items,
        });

        res.status(201).json({ checklistTemplate });
    } catch (err) {
        console.error('createChecklistTemplate error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST - create a checklist template from a base template

exports.createChecklistTemplateFromBaseTemplate = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const {
            baseTemplateId,
            name,
            category,
            appliesTo,
            description,
        } = req.body;

        if (!baseTemplateId) {
            return res.status(400).json({
                message: 'baseTemplateId is required',
            });
        }

        const baseTemplate = await ChecklistBaseTemplate.findOne({
            _id: baseTemplateId,
            isActive: true,
        });

        if (!baseTemplate) {
            return res.status(404).json({
                message: 'Checklist base template not found',
            });
        }

        const checklistTemplate = await ChecklistTemplate.create({
            organisationId,
            baseTemplateId: baseTemplate._id,
            name: name || baseTemplate.name,
            category: category || baseTemplate.category,
            appliesTo: appliesTo || baseTemplate.appliesTo,
            description: description || baseTemplate.description || '',
            items: baseTemplate.items.map((item) => ({
                label: item.label,
                notes: item.notes || '',
                sortOrder: item.sortOrder ?? 0,
                isRequired: item.isRequired ?? true,
            })),
        });

        res.status(201).json({ checklistTemplate });
    } catch (err) {
        console.error('createChecklistTemplateFromBaseTemplate error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET - all checklist templates for this organisation

exports.getChecklistTemplates = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { category, appliesTo } = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (category) filter.category = category;
        if (appliesTo) filter.appliesTo = appliesTo;

        const checklistTemplates = await ChecklistTemplate.find(filter)
            .sort({ createdAt: -1 });

        res.json({ checklistTemplates });
    } catch (err) {
        console.error('getChecklistTemplates error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET - checklist template by ID

exports.getChecklistTemplateById = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const checklistTemplate = await ChecklistTemplate.findOne({
            _id: id,
            organisationId,
            isActive: true,
        });

        if (!checklistTemplate) {
            return res.status(404).json({ message: 'Checklist template not found' });
        }

        res.json({ checklistTemplate });
    } catch (err) {
        console.error('getChecklistTemplateById error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH - update checklist template

exports.updateChecklistTemplate = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const checklistTemplate = await ChecklistTemplate.findOneAndUpdate(
            { _id: id, organisationId, isActive: true },
            req.body,
            { new: true, runValidators: true }
        );

        if (!checklistTemplate) {
            return res.status(404).json({ message: 'Checklist template not found' });
        }

        res.json({ checklistTemplate });
    } catch (err) {
        console.error('updateChecklistTemplate error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE - archive checklist template

exports.archiveChecklistTemplate = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const checklistTemplate = await ChecklistTemplate.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false },
            { new: true }
        );

        if (!checklistTemplate) {
            return res.status(404).json({ message: 'Checklist template not found' });
        }

        res.json({
            message: 'Checklist template archived',
            checklistTemplate,
        });
    } catch (err) {
        console.error('archiveChecklistTemplate error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH - unarchive checklist template

exports.unarchiveChecklistTemplate = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const checklistTemplate = await ChecklistTemplate.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true },
            { new: true }
        );

        if (!checklistTemplate) {
            return res.status(404).json({ message: 'Checklist template not found' });
        }

        res.json({
            message: 'Checklist template unarchived',
            checklistTemplate,
        });
    } catch (err) {
        console.error('unarchiveChecklistTemplate error', err);
        res.status(500).json({ message: 'Server error' });
    }
};