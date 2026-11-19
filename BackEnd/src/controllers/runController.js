const Run = require("../models/Run");
const EventVehicle = require("../models/EventVehicle");
const Event = require("../models/Event");
const Track = require("../models/Track");
const LapTime = require("../models/LapTimes");
const TyreRun = require("../models/TyreRun");
const Vehicle = require("../models/Vehicle");
const {
    updateTyreMileageForRun,
} = require("./tyreRunController");

// Adds (or with a negative number, removes) km on the ODO of the vehicle a
// run belongs to. Treats a missing ODO as 0.
async function adjustVehicleOdo(eventVehicleId, organisationId, km) {
    if (!km) return;

    const eventVehicle = await EventVehicle.findOne({
        _id: eventVehicleId,
        organisationId,
    });

    if (!eventVehicle) return;

    await Vehicle.updateOne(
        { _id: eventVehicle.vehicleId, organisationId },
        // Rounded to the metre so floating point errors don't pile up
        [{ $set: { odo: { $round: [{ $add: [{ $ifNull: ["$odo", 0] }, km] }, 3] } } }]
    );
}

exports.carIn = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const run = await Run.findOne({
            _id: id,
            organisationId,
            isActive: true,
        });

        if (!run) {
            return res.status(404).json({ message: "Run not found" });
        }

        const laps = await LapTime.find({
            organisationId,
            runId: id,
            isActive: true,
        }).sort({ lapNumber: 1 });

        const validLaps = laps.filter(
            (lap) => !lap.isOutLap && !lap.isInLap
        );

        run.inTime = new Date();
        // This below is all of the avlid timed laps
        run.lapsDone = validLaps.length;

        // LAP TIME CALCULATIONS:

        if (laps.length > 0) {
            const validLapTimes = validLaps
                .map((lap) => lap.lapTimeS)
                .filter((time) => 
                    Number.isFinite(time)
                );


            if (validLapTimes.length > 0) {
                const totalLapTime = 
                    validLapTimes.reduce(
                        (total, time) =>
                            total + time,
                    0
                );

                run.bestLapS = 
                    Math.min(...validLapTimes);

                run.averageLapS = 
                    totalLapTime / 
                    validLapTimes.length;
            }
        }
        // FUEL CALCULATIONS 

            const lapsWithFuel = laps.filter(
                (lap) =>
                    lap.fuelRemaining !== undefined &&
                    lap.fuelRemaining !== null &&
                    Number.isFinite(
                        lap.fuelRemaining
                    )
            );

            if (
                lapsWithFuel.length > 0 &&
                run.fuelStart !== undefined &&
                run.fuelStart !== null
            ) {
                const finalFuelReading =
                    lapsWithFuel[
                        lapsWithFuel.length - 1
                    ].fuelRemaining;

                run.fuelEnd = finalFuelReading;
                run.fuelUsed = run.fuelStart - finalFuelReading;

                run.fuelPerLap =
                    lapsWithFuel.length > 0
                        ? run.fuelUsed / lapsWithFuel.length
                        : 0;
            }
        
        //  RUN DISTANCE -> TYRE MILEAGE AND VEHICLE ODO

        // These are a bonus: if the distance can't be worked out (no track
        // distance), the car should still be marked as in and the run stats
        // saved. We just report a warning instead.
        let warning;

        const eventVehicle = await EventVehicle.findOne({
            _id: run.eventVehicleId,
            organisationId,
            isActive: true,
        });

        const event = eventVehicle
            ? await Event.findOne({
                _id: eventVehicle.eventId,
                organisationId,
                isActive: true,
            })
            : null;

        const track = event
            ? await Track.findOne({
                _id: event.trackId,
                organisationId,
                isActive: true,
            })
            : null;

        const trackDistanceOk =
            track &&
            Number.isFinite(track.distanceKms) &&
            track.distanceKms > 0;

        if (trackDistanceOk) {
            // Every lap the car physically drove, including in and out laps
            const physicalLaps = laps.length;

            const runDistanceKm =
                Math.round(physicalLaps * track.distanceKms * 1000) / 1000;

            const tyreRun = await TyreRun.findOne({
                organisationId,
                runId: run._id,
                isActive: true,
            });

            if (tyreRun) {
                await updateTyreMileageForRun(
                    tyreRun,
                    runDistanceKm,
                    organisationId,
                );
            }

            // Only add what this run hasn't already added to the ODO
            const odoDifference = runDistanceKm - (run.distanceKm ?? 0);
            await adjustVehicleOdo(run.eventVehicleId, organisationId, odoDifference);
            run.distanceKm = runDistanceKm;
        } else {
            warning =
                "Tyre mileage and ODO not updated: track distance is not configured";
        }

        await run.save();

        res.json({
            message: "Car marked as in and run calculated",
            run,
            ...(warning && { warning }),
        });
    } catch (err) {
        console.error("Car in error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// POST - create a run

exports.createRun = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;

        const {
            eventVehicleId,
            name,
            weather,
            trackTemp,
            trackCondition,
            fuelStart,
            notes,
        } = req.body;

        if (
            !eventVehicleId ||
            fuelStart == null
        ) {
            return res.status(400).json({
                message: "EventVehicleId and fuelStart are required"
            });
        }

        const run = await Run.create({
            organisationId,
            eventVehicleId,
            name: name || "",
            weather: weather || "",
            trackTemp: trackTemp ?? undefined,
            trackCondition: trackCondition || "",
            fuelStart,
            lapsDone: 0,
            fuelUsed: 0,
            fuelPerLap: 0,
            averageLapS: 0,
            notes: notes || "",
        });

        res.status(201).json({ run });
    } catch (err) {
        console.error("createRun error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// GET Runs for eventVehicleId

exports.getRuns = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { eventVehicleId } = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (eventVehicleId) {
            filter.eventVehicleId = eventVehicleId;
        }

        const runs = await Run.find(filter).sort({ createdAt: -1 });
        res.json({ runs });
    } catch (err) {
        console.error("getRuns error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// GET run by ID:

exports.getRunById = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const run = await Run.findOne({
            _id: id,
            organisationId
        });

        if (!run) {
            return res.status(404).json({ message: "Run not found" });
        }

        res.json({ run });
    } catch (err) {
        console.error("get RunById error", err);
        res.status(500).json({ message: "Server error" })
    }
}

// Update run

exports.updateRun = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const run = await Run.findOne({
            _id: id,
            organisationId,
            isActive: true,
        });

        if (!run) {
            return res.status(404).json({ message: "Run Not Found" });
        }

        // distanceKm is managed by "car in" and isActive by archive/unarchive,
        // both of which keep the vehicle's ODO in step - don't let a plain
        // update change them.
        const { distanceKm, isActive, ...updates } = req.body;
        Object.assign(run, updates);

        if (run.fuelStart != null && run.fuelEnd != null) {
            run.fuelUsed = run.fuelStart - run.fuelEnd;
            run.fuelPerLap =
                run.lapsDone && run.lapsDone > 0 ? run.fuelUsed / run.lapsDone : 0;
        }
        await run.save();

        res.json({ run });
    } catch (err) {
        console.error("Update Run error", err);
        res.status(500).json({ message: "Server Error" });
    }
};


// Archive / delete run

exports.archiveRun = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const run = await Run.findOne({ _id: id, organisationId });
        if (!run) {
            return res.status(404).json({ message: "Run Not Found" });
        }

        // Only take the run's km off the ODO if it wasn't already archived
        if (run.isActive) {
            run.isActive = false;
            await run.save();
            await adjustVehicleOdo(run.eventVehicleId, organisationId, -(run.distanceKm ?? 0));
        }

        res.json({ message: "Run Archived", run });
    } catch (err) {
        console.error("Archive run error", err);
        res.status(500).json({ message: "Server Error" });
    }
};


// Unarchive a run

exports.unarchiveRun = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const run = await Run.findOne({ _id: id, organisationId });
        if (!run) {
            return res.status(404).json({ message: "Run Not Found" });
        }

        // Only add the run's km back to the ODO if it was actually archived
        if (!run.isActive) {
            run.isActive = true;
            await run.save();
            await adjustVehicleOdo(run.eventVehicleId, organisationId, run.distanceKm ?? 0);
        }

        res.json({ message: "Run Unarchived", run });
    } catch (err) {
        console.error("Unarchive run error", err);
        res.status(500).json({ message: "Server Error" });
    }
};