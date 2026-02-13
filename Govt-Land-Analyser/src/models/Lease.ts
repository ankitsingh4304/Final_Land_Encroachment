import mongoose, { Schema, Document, Model } from "mongoose";
import type { IUser } from "./User";

export type LeaseStatus = "active" | "expired" | "warning_sent";

export interface ILease extends Document {
  user: IUser["_id"];
  userEmail: string;
  plotId: number;
  areaId?: string | null;
  leaseYears: number;
  allotmentDate: Date;
  leaseEndDate: Date;
  status: LeaseStatus;
  bidPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeaseSchema = new Schema<ILease>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: true },
    plotId: { type: Number, required: true, index: true },
    areaId: { type: String, default: null, index: true },
    leaseYears: { type: Number, required: true },
    allotmentDate: { type: Date, required: true },
    leaseEndDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "expired", "warning_sent"],
      default: "active",
      required: true,
    },
    bidPrice: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

LeaseSchema.index({ plotId: 1 }, { unique: true });

export const Lease: Model<ILease> =
  (mongoose.models.Lease as Model<ILease>) ||
  mongoose.model<ILease>("Lease", LeaseSchema);

