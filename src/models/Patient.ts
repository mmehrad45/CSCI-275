// src/models/Patient.ts
import mongoose, { Schema, Model, models } from "mongoose";

export interface IPatient {
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // YYYY-MM-DD
  phone?: string;
  email?: string;
  healthNumber?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: String },
    phone: { type: String },
    email: { type: String },
    healthNumber: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

export const Patient: Model<IPatient> =
  models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);