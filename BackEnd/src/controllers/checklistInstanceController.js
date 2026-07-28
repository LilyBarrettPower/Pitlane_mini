const ChecklistInstance = require("../models/ChecklistInstance");
const ChecklistTemplate = require("../models/ChecklistTemplate");

// POST - create checklist instance from checklist template

exports.createChecklistInstanceFromTemplate = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;

        const {
            checklistTemplateId,
            name,
            eventId,
            vehicleId,
            runId,
        } = req.body;

        if (!checklistTemplateId) {
            return res.status(400).json({
                message: "checklistTemplateId is required",
            });
        }

        const checklistTemplate = await ChecklistTemplate.findOne({
            _id: checklistTemplateId,
            organisationId,
            isActive: true,
        });

        if (!checklistTemplate) {
            return res.status(404).json({
                message: "Checklist template not found",
            });
        }

        const checklistInstance = await ChecklistInstance.create({
            organisationId,
            checklistTemplateId: checklistTemplate._id,
            name: name || checklistTemplate.name,
            category: checklistTemplate.category || "general",
            appliesTo: checklistTemplate.appliesTo || "general",
            eventId: eventId || null,
            vehicleId: vehicleId || null,
            runId: runId || null,
            items: checklistTemplate.items.map((item) => ({
                label: item.label,
                notes: item.notes || "",
                sortOrder: item.sortOrder ?? 0,
                isRequired: item.isRequired ?? true,
                done: false,
                answer: "",
                doneAt: null,
            })),
            status: "open",
        });

        res.status(201).json({ checklistInstance });
    } catch (err) {
        console.error("createChecklistInstanceFromTemplate error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST - create checklist instance from scratch

exports.createChecklistInstance = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;

        const {
            checklistTemplateId,
            name,
            category,
            appliesTo,
            eventId,
            vehicleId,
            runId,
            items,
        } = req.body;

        if (!name || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Name and at least one checklist item are required",
            });
        }

        const checklistInstance = await ChecklistInstance.create({
            organisationId,
            checklistTemplateId: checklistTemplateId || null,
            name,
            category: category || "general",
            appliesTo: appliesTo || "general",
            eventId: eventId || null,
            vehicleId: vehicleId || null,
            runId: runId || null,
            items: items.map((item) => ({
                label: item.label,
                notes: item.notes || "",
                sortOrder: item.sortOrder ?? 0,
                isRequired: item.isRequired ?? true,
                done: item.done ?? false,
                answer: item.answer || "",
                doneAt: item.doneAt || null,
            })),
            status: "open",
        });

        res.status(201).json({ checklistInstance });
    } catch (err) {
        console.error("createChecklistInstance error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET checklist instances

exports.getChecklistInstances = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { eventId, vehicleId, runId, status, checklistTemplateId } = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (eventId) filter.eventId = eventId;
        if (vehicleId) filter.vehicleId = vehicleId;
        if (runId) filter.runId = runId;
        if (status) filter.status = status;
        if (checklistTemplateId) filter.checklistTemplateId = checklistTemplateId;

        const checklistInstances = await ChecklistInstance.find(filter).sort({ createdAt: -1 });

        res.json({ checklistInstances });
    } catch (err) {
        console.error("getChecklistInstances error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET checklist instance by ID

exports.getChecklistInstanceById = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const checklistInstance = await ChecklistInstance.findOne({
            _id: id,
            organisationId,
            isActive: true,
        });

        if (!checklistInstance) {
            return res.status(404).json({ message: "Checklist instance not found" });
        }

        res.json({ checklistInstance });
    } catch (err) {
        console.error("getChecklistInstanceById error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH checklist instance

exports.updateChecklistInstance = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const updateData = { ...req.body };

        if (updateData.status === "completed" && !updateData.completedAt) {
            updateData.completedAt = new Date();
        }

        const checklistInstance = await ChecklistInstance.findOneAndUpdate(
            { _id: id, organisationId, isActive: true },
            updateData,
            { new: true, runValidators: true }
        );

        if (!checklistInstance) {
            return res.status(404).json({ message: "Checklist instance not found" });
        }

        res.json({ checklistInstance });
    } catch (err) {
        console.error("updateChecklistInstance error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE / archive checklist instance

exports.archiveChecklistInstance = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const checklistInstance = await ChecklistInstance.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false, status: "archived" },
            { new: true }
        );

        if (!checklistInstance) {
            return res.status(404).json({ message: "Checklist instance not found" });
        }

        res.json({
            message: "Checklist instance archived",
            checklistInstance,
        });
    } catch (err) {
        console.error("archiveChecklistInstance error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH unarchive checklist instance

exports.unarchiveChecklistInstance = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const checklistInstance = await ChecklistInstance.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true, status: "open" },
            { new: true }
        );

        if (!checklistInstance) {
            return res.status(404).json({ message: "Checklist instance not found" });
        }

        res.json({
            message: "Checklist instance unarchived",
            checklistInstance,
        });
    } catch (err) {
        console.error("unarchiveChecklistInstance error", err);
        res.status(500).json({ message: "Server error" });
    }
};