// src/models/Room.ts

import mongoose, { Schema, Model, models } from "mongoose";

export interface IRoom {
  name: string;
  code: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
  },
  { timestamps: true },
);

export const Room: Model<IRoom> =
  models.Room || mongoose.model<IRoom>("Room", RoomSchema);