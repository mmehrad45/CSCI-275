// src/models/Task.ts
import mongoose, { Schema, Model, Types } from "mongoose";

export type TaskAudience = "reception" | "doctor";
export interface ITask {
  _id: Types.ObjectId;
  title: string;
  description: string;
  patientId?: string;
  notes?: string;

  forType: TaskAudience;

  createdBy?: string;
  createdByRole?: "officeManager" | "doctor";

  dueDate: Date;

  completed: boolean;
  completedByEmployeeId?: string;
  completedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },

    patientId: { type: String },
    notes: { type: String },

    forType: { type: String, enum: ["reception", "doctor"], required: true },

    createdBy: { type: String },
    createdByRole: { type: String, enum: ["officeManager", "doctor"] },

    dueDate: { type: Date, required: true },

    completed: { type: Boolean, default: false },
    completedByEmployeeId: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);