import { Schema, model } from "mongoose";

const restaurantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    openingHours: {
      type: String,
      required: true,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Restaurant = model("Restaurant", restaurantSchema);

restaurantSchema.index({
    name: 1
});