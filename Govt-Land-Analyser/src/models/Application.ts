import mongoose, { Schema, Document, Model } from "mongoose";
import type { IUser } from "./User";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface IApplication extends Document {
  user: IUser["_id"];
  userName: string;
  userEmail: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
  addressDescription?: string;
  quotedPrice: number;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    contactNumber: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    addressDescription: { type: String },
    quotedPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Application: Model<IApplication> =
  (mongoose.models.Application as Model<IApplication>) ||
  mongoose.model<IApplication>("Application", ApplicationSchema);

