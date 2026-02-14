import mongoose, { Schema, Document, Model } from "mongoose";
import type { IUser } from "./User";

export interface IViolation extends Document {
  user?: IUser["_id"] | null;
  /**
   * Email of the user mapped to this plot (from User collection), stored when flagging.
   */
  user_mail?: string | null;
  /**
   * Plot identifier from the clickable layout (e.g. "A-12" or "12").
   */
  plotId: string;
  /**
   * Industrial area identifier (e.g. "area-1").
   */
  areaId: string;
  /**
   * Whether a violation is currently detected for this plot.
   */
  violationStatus: boolean;
  /**
   * Public or storage-relative path to the generated PDF report (legacy).
   */
  reportPdfPath?: string | null;
  /**
   * GridFS file id for the stored PDF report.
   */
  reportFileId?: mongoose.Types.ObjectId | null;
  /**
   * Optional: processed/annotated output image path from the analysis.
   */
  outputImagePath?: string | null;
  /**
   * Comments entered by the admin while flagging/updating.
   */
  adminComments?: string | null;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ViolationSchema = new Schema<IViolation>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false },
    user_mail: { type: String, default: null },
    plotId: { type: String, required: true, index: true },
    areaId: { type: String, required: true, index: true },
    violationStatus: { type: Boolean, default: false },
    reportPdfPath: { type: String, default: null },
    reportFileId: { type: Schema.Types.ObjectId, default: null },
    outputImagePath: { type: String, default: null },
    adminComments: { type: String, trim: true, default: null },
    analyzedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// One violation record per (areaId, plotId)
ViolationSchema.index({ areaId: 1, plotId: 1 }, { unique: true });

export const Violation: Model<IViolation> =
  (mongoose.models.Violation as Model<IViolation>) ||
  mongoose.model<IViolation>("Violation", ViolationSchema);

