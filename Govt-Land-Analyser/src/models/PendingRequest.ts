import mongoose, { Schema, model, models } from "mongoose";

/** Land request workflow: district_pending → state_pending → allocated */
export type RequestWorkflowStage =
  | "district_pending"
  | "state_pending"
  | "allocated"
  | "rejected";

const PendingRequestSchema = new Schema({
  plotId: { type: Number, required: true },
  points: { type: String, required: true },
  quotedPrice: { type: Number, required: true },
  purpose: { type: String, required: true },
  quotedBy: { type: String, required: true },
  status: { type: String, default: "pending" },
  submittedAt: { type: Date, default: Date.now },
  /** Workflow: first district admin approval, then state admin approval, then allocated */
  workflowStage: {
    type: String,
    enum: ["district_pending", "state_pending", "allocated", "rejected"],
    default: "district_pending",
  },
  districtApprovedAt: { type: Date, default: null },
  stateApprovedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  rejectedBy: { type: String, default: null }, // "district" | "state"
});

export default models.PendingRequest || model("PendingRequest", PendingRequestSchema);