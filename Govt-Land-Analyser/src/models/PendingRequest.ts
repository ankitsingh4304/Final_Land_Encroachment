import mongoose, { Schema, model, models } from "mongoose";

const PendingRequestSchema = new Schema({
  plotId: { type: Number, required: true },
  points: { type: String, required: true },
  quotedPrice: { type: Number, required: true },
  purpose: { type: String, required: true },
  quotedBy: { type: String, required: true }, 
  status: { type: String, default: "pending" },
  submittedAt: { type: Date, default: Date.now }
});

export default models.PendingRequest || model("PendingRequest", PendingRequestSchema);