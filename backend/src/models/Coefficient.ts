import { Schema, model, Types } from "mongoose";

const coefficientSchema = new Schema(
  {
    roomId: { type: Types.ObjectId, ref: "Room" },
    bnovoId: { type: String, required: true, unique: true },
    coefficient1: { type: Number, default: 1 },
    coefficient2: { type: Number, default: 1 },
    coefficient3: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const Coefficient = model("Coefficient", coefficientSchema);
