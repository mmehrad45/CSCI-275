// src/models/User.ts

import mongoose, { Schema, Model, models } from "mongoose";

export type UserRole = "doctor" | "receptionist" | "officeManager";

export interface IUser {
  name: string;
  email: string;
  password: string; // demo only (plaintext)
  role: UserRole;
  employeeId: string;
  doctorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["doctor", "receptionist", "officeManager"],
      required: true,
    },
    employeeId: { type: String, required: true },
    doctorId: { type: String },
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  models.User || mongoose.model<IUser>("User", UserSchema);