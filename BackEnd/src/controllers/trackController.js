const Track = require("../models/Track");
const { TRACK_LIBRARY, findLibraryTrack } = require("../data/trackLibrary");

// Track length must be a positive number (it drives tyre mileage and ODO).
// Returns { value } or { error }.
function parseDistance(distanceKms, { required }) {
    if (distanceKms === undefined || distanceKms === null || distanceKms === "") {
        return required ? { error: "Track length (km) is required" } : { value: null };
    }

    const value = Number(distanceKms);
    if (!Number.isFinite(value) || value <= 0 || value > 50) {
        return { error: "Track length must be a number of km greater than 0" };
    }

    return { value: Math.round(value * 1000) / 1000 };
}

function isDuplicateNameError(err) {
    return err && err.code === 11000;
}

// POST - create a custom track
exports.createTrack = async (req, res) => {
    try {
        const { name, distanceKms, country, city, notes } = req.body;

        if (!String(name || "").trim() || !String(country || "").trim()) {
            return res.status(400).json({ message: "Name and country are required" });
        }

        const distance = parseDistance(distanceKms, { required: true });
        if (distance.error) {
            return res.status(400).json({ message: distance.error });
        }

        const details = {
            name: String(name).trim(),
            distanceKms: distance.value,
            country: String(country).trim(),
            city: String(city || "").trim(),
            notes: notes || "",
        };

        // A track with this name that was removed earlier: bring it back
        // with the new details (names are unique per team, removed or not)
        const removed = await Track.findOne({
            organisationId: req.user.organisationId,
            name: details.name,
            isActive: false,
        });

        if (removed) {
            Object.assign(removed, details, { isActive: true });
            await removed.save();
            return res.status(201).json({ track: removed });
        }

        const track = await Track.create({
            organisationId: req.user.organisationId,
            ...details,
        });

        res.status(201).json({ track });
    } catch (err) {
        if (isDuplicateNameError(err)) {
            return res.status(409).json({ message: "Your team already has a track with that name" });
        }
        console.error("createTrack error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET - the built-in track library, marking which tracks the team already has.
// ?country=NZ for one country; without it, every country.
exports.getTrackLibrary = async (req, res) => {
    try {
        const { country } = req.query;

        const teamTracks = await Track.find({
            organisationId: req.user.organisationId,
            isActive: true,
            libraryKey: { $ne: null },
        }).select("libraryKey");
        const added = new Set(teamTracks.map((track) => track.libraryKey));

        const countries = Object.entries(TRACK_LIBRARY)
            .filter(([code]) => !country || code === String(country).toUpperCase())
            .map(([code, entry]) => ({
                countryCode: code,
                countryName: entry.countryName,
                tracks: entry.tracks.map((track) => ({
                    ...track,
                    country: entry.countryName,
                    alreadyAdded: added.has(track.key),
                })),
            }));

        res.json({ countries });
    } catch (err) {
        console.error("getTrackLibrary error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST - add a library track to the team (or return it if already added).
// Body: { key }
exports.addTrackFromLibrary = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const libraryTrack = findLibraryTrack(req.body.key);

        if (!libraryTrack) {
            return res.status(404).json({ message: "Track not found in the library" });
        }

        // Already linked (possibly archived - bring it back)
        let track = await Track.findOne({ organisationId, libraryKey: libraryTrack.key });

        // A track the team made themselves with the same name - link it
        // rather than creating a duplicate (names are unique per team)
        if (!track) {
            track = await Track.findOne({ organisationId, name: libraryTrack.name });
            if (track) track.libraryKey = libraryTrack.key;
        }

        if (track) {
            track.isActive = true;
            if (track.distanceKms == null) track.distanceKms = libraryTrack.distanceKms;
            await track.save();
            return res.json({ track });
        }

        track = await Track.create({
            organisationId,
            name: libraryTrack.name,
            city: libraryTrack.city,
            country: libraryTrack.country,
            distanceKms: libraryTrack.distanceKms,
            libraryKey: libraryTrack.key,
        });

        res.status(201).json({ track });
    } catch (err) {
        console.error("addTrackFromLibrary error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET - the team's tracks
exports.getTracks = async (req, res) => {
    try {
        const filter = {
            organisationId: req.user.organisationId,
            isActive: true,
        };

        if (req.query.country) {
            filter.country = req.query.country;
        }

        const tracks = await Track.find(filter).sort({ name: 1 });
        res.json({ tracks });
    } catch (err) {
        console.error("getTracks error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET track by ID
exports.getTrackById = async (req, res) => {
    try {
        const track = await Track.findOne({
            _id: req.params.id,
            organisationId: req.user.organisationId,
        });

        if (!track) {
            return res.status(404).json({ message: "Track not found" });
        }

        res.json({ track });
    } catch (err) {
        console.error("get TrackById error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH - update a track's details (name, length, city, country, notes)
exports.updateTrack = async (req, res) => {
    try {
        const updates = {};

        if (req.body.name !== undefined) {
            const name = String(req.body.name).trim();
            if (!name) return res.status(400).json({ message: "Track name is required" });
            updates.name = name;
        }

        if (req.body.country !== undefined) {
            const country = String(req.body.country).trim();
            if (!country) return res.status(400).json({ message: "Country is required" });
            updates.country = country;
        }

        if (req.body.distanceKms !== undefined) {
            const distance = parseDistance(req.body.distanceKms, { required: true });
            if (distance.error) return res.status(400).json({ message: distance.error });
            updates.distanceKms = distance.value;
        }

        if (req.body.city !== undefined) updates.city = String(req.body.city || "").trim();
        if (req.body.notes !== undefined) updates.notes = String(req.body.notes || "");

        const track = await Track.findOneAndUpdate(
            { _id: req.params.id, organisationId: req.user.organisationId, isActive: true },
            updates,
            { new: true, runValidators: true }
        );

        if (!track) {
            return res.status(404).json({ message: "Track Not Found" });
        }
        res.json({ track });
    } catch (err) {
        console.error("Update Track error", err);
        if (isDuplicateNameError(err)) {
            return res.status(409).json({ message: "Your team already has a track with that name" });
        }
        res.status(500).json({ message: "Server Error" });
    }
};

// Archive / delete track
exports.archiveTrack = async (req, res) => {
    try {
        const track = await Track.findOneAndUpdate(
            { _id: req.params.id, organisationId: req.user.organisationId },
            { isActive: false },
            { new: true }
        );
        if (!track) {
            return res.status(404).json({ message: "Track Not Found" });
        }
        res.json({ message: "Track Archived", track });
    } catch (err) {
        console.error("Archive track error", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Unarchive a track
exports.unarchiveTrack = async (req, res) => {
    try {
        const track = await Track.findOneAndUpdate(
            { _id: req.params.id, organisationId: req.user.organisationId },
            { isActive: true },
            { new: true }
        );
        if (!track) {
            return res.status(404).json({ message: "Track Not Found" });
        }
        res.json({ message: "Track Unarchived", track });
    } catch (err) {
        console.error("Unarchive track error", err);
        res.status(500).json({ message: "Server Error" });
    }
};
