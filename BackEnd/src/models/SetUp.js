const mongoose = require("mongoose");

const SetUpSchema = new mongoose.Schema({
  organisationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organisation",
    required: true,
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  version: {type: String},
  springNm: {
    front: Number,
    rear: Number
  },
  arbPos: {
    front: Number,
    rear: Number
  },
  rideHeight: {
    front: Number, 
    rear: Number
  },
  camber: {
    front: String,
    rear: String
  },
  toe: {
    front: String,
    rear: String
  },
  packers:{
    front: String, 
    rear: String
  },
  diffPreload: {type: Number},
  brakeBias: {type: String},
  wingHole: {type: String},
  splitter: {type: String},
  notes: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

SetUpSchema.index({ organisationId: 1, vehicleId: 1 });


module.exports = mongoose.model("SetUp", SetUpSchema);