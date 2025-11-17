// src/models/Appointment.ts
import mongoose, { Schema, Model, Types } from "mongoose";

export type AppointmentStatus = "scheduled" | "cancelled";

export interface IAppointment {
  _id: Types.ObjectId;
  patientId: Types.ObjectId | string;
  /** Denormalized for fast UI; keep in sync when creating/updating */
  patientName?: string;
  doctorId: string; // or Types.ObjectId if you later switch to refs
  roomId: string;   // or Types.ObjectId if you later switch to refs
  date: string;     // "YYYY-MM-DD"
  time: string;     // "HH:mm"
  notes?: string;
  status: AppointmentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.Mixed, required: true },
    patientName: { type: String, default: "" },

    doctorId: { type: String, required: true },
    roomId: { type: String, required: true },

    date: { type: String, required: true }, // keep simple string format
    time: { type: String, required: true }, // keep simple string format

    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: ["scheduled", "cancelled"],
      default: "scheduled",
      required: true,
    },
  },
  { timestamps: true }
);

// Avoid recompiling model on hot reloads
export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);