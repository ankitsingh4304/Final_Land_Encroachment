import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  contactNumber: string;
  role: UserRole;
  /**
   * Plot identifier owned by this user (e.g. "A-12" or "12").
   * This links to the clickable layout / Plot model.
   */
  plotId?: string | null;
  /**
   * Industrial area identifier where the plot resides (e.g. "area-1").
   */
  areaId?: string | null;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    contactNumber: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    plotId: {
      type: String,
      index: true,
      default: null,
    },
    areaId: {
      type: String,
      index: true,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

