const mongoose = require('mongoose');

const TyreRunSchema = new mongoose.Schema({
  organisationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true,
  },
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Run',
    required: true,
  },

  tyres: {
    LF: { type: mongoose.Schema.Types.ObjectId, ref: 'Tyre', required: true },
    RF: { type: mongoose.Schema.Types.ObjectId, ref: 'Tyre', required: true },
    LR: { type: mongoose.Schema.Types.ObjectId, ref: 'Tyre', required: true },
    RR: { type: mongoose.Schema.Types.ObjectId, ref: 'Tyre', required: true },
  },

  coldPsi: {
    LF: Number,
    RF: Number,
    LR: Number,
    RR: Number,
  },
  hotPsi: {
    LF: Number,
    RF: Number,
    LR: Number,
    RR: Number,
  },
  coldTempC: {
    LF: Number,
    RF: Number,
    LR: Number,
    RR: Number,
  },
  hotTempC: {
    LF: Number,
    RF: Number,
    LR: Number,
    RR: Number,
  },

  distanceKm: {
    LF: { type: Number, default: 0, min: 0 },
    RF: { type: Number, default: 0, min: 0 },
    LR: { type: Number, default: 0, min: 0 },
    RR: { type: Number, default: 0, min: 0 },
  },

  heatCycleIncrement: {
    LF: { type: Number, default: 1 },
    RF: { type: Number, default: 1 },
    LR: { type: Number, default: 1 },
    RR: { type: Number, default: 1 },
  },

  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

TyreRunSchema.index({ organisationId: 1, runId: 1 });


module.exports = mongoose.model('TyreRun', TyreRunSchema);