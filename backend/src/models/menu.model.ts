import { Schema, model, Types } from "mongoose";

const modifierOptionSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            default: 0,
            min: 0,
        },

        available: {
            type: Boolean,
            default: true,
        },

        modifierGroups: [],
    },
    { _id: false }
);

const modifierGroupSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        required: {
            type: Boolean,
            default: false,
        },

        multiple: {
            type: Boolean,
            default: false,
        },

        minSelection: {
            type: Number,
            default: 0,
        },

        maxSelection: {
            type: Number,
            default: 1,
        },

        options: [modifierOptionSchema],
    },
    { _id: false }
);

// Recursive nesting
modifierOptionSchema.add({
    modifierGroups: [modifierGroupSchema],
});

const menuSchema = new Schema(
    {
        restaurantId: {
            type: Types.ObjectId,
            ref: "Restaurant",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        category: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        basePrice: {
            type: Number,
            required: true,
            min: 0,
        },

        image: {
            type: String,
        },

        available: {
            type: Boolean,
            default: true,
            index: true,
        },

        preparationTime: {
            type: Number,
            default: 15,
        },

        keywords: [
            {
                type: String,
                lowercase: true,
                trim: true,
            },
        ],

        modifierGroups: [modifierGroupSchema],
    },
    {
        timestamps: true,
    }
);

menuSchema.index({
    name: "text",
    description: "text",
    keywords: "text",
});

export const Menu = model("Menu", menuSchema);

menuSchema.index({ restaurantId: 1 });

menuSchema.index({ category: 1 });

menuSchema.index({ available: 1 });

menuSchema.index({
    name: "text",
    description: "text",
    keywords: "text",
});