

import mongoose, { Schema, Model, models } from "mongoose";

export interface IDoctor {
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  { timestamps: true },
);

export const Doctor: Model<IDoctor> =
  models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);