import mongoose, { Schema, Document, Model } from "mongoose";
import type { IUser } from "./User";
import type { IViolation } from "./Violation";

/** Appeal workflow: district_pending → district_approved | district_rejected | forwarded_to_state → state_pending → state_approved | state_rejected */
export type AppealStage =
  | "district_pending"
  | "district_approved"   // found feasible → goes to state with remark
  | "district_rejected"   // user can then appeal directly to state
  | "forwarded_to_state"  // district could not decide → sent to state
  | "state_pending"
  | "state_approved"
  | "state_rejected";

export interface IAppeal extends Document {
  user: IUser["_id"];
  violation: mongoose.Types.ObjectId;
  /** User's reason for appeal */
  userMessage: string;
  stage: AppealStage;
  /** Set when district approves: "Appeal heard and found correct by district admin" */
  districtRemark?: string | null;
  /** District decision: approved | rejected | forwarded */
  districtDecision?: "approved" | "rejected" | "forwarded" | null;
  /** State admin remark */
  stateRemark?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AppealSchema = new Schema<IAppeal>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    violation: { type: Schema.Types.ObjectId, ref: "Violation", required: true },
    userMessage: { type: String, required: true },
    stage: {
      type: String,
      enum: [
        "district_pending",
        "district_approved",
        "district_rejected",
        "forwarded_to_state",
        "state_pending",
        "state_approved",
        "state_rejected",
      ],
      default: "district_pending",
    },
    districtRemark: { type: String, default: null },
    districtDecision: {
      type: String,
      enum: ["approved", "rejected", "forwarded"],
      default: null,
    },
    stateRemark: { type: String, default: null },
  },
  { timestamps: true }
);

AppealSchema.index({ user: 1 });
AppealSchema.index({ violation: 1 });
AppealSchema.index({ stage: 1 });

export const Appeal: Model<IAppeal> =
  (mongoose.models.Appeal as Model<IAppeal>) ||
  mongoose.model<IAppeal>("Appeal", AppealSchema);
