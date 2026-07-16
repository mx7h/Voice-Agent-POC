import { Schema, model } from "mongoose";

const selectedModifierSchema = new Schema(

  {
    modifierOptionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    groupName: {
      type: String,
      required: true,
      trim: true,
    },

    optionName: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    menuId: {
      type: Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    selectedModifiers: [selectedModifierSchema],

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "completed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    confirmationSent: {
      type: Boolean,
      default: false,
    },

    smsSent: {
      type: Boolean,
      default: false,
    },

    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


export const Order = model("Order", orderSchema);


orderSchema.index({ sessionId: 1 });

orderSchema.index({ orderStatus: 1 });

orderSchema.index({ createdAt: -1 });
