import { Schema, model } from "mongoose";

const roomSchema = new Schema(
  {
    bnovoId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

export const Room = model("Room", roomSchema);
