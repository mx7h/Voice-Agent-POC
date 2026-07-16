import "dotenv/config";

import mongoose from "mongoose";

import { connectDB } from "../config/mongodb.js";

import { Restaurant } from "../models/restaurant.model.js";
import { Menu } from "../models/menu.model.js";

async function seed() {
    try {
        await connectDB();

        console.log("Connected");

        await Restaurant.deleteMany({});
        await Menu.deleteMany({});

        console.log("Old data deleted");

        const restaurant = await Restaurant.create({
            name: "Food Paradise",
            address: "Hyderabad",
            phone: "9876543210",
            email: "orders@foodparadise.com",
            openingHours: "10:00 AM - 11:00 PM",
            timezone: "Asia/Kolkata",
            isOpen: true,
        });

        console.log("Restaurant created");

        await Menu.insertMany([
            {
                restaurantId: restaurant._id,

                name: "Margherita Pizza",

                description: "Classic cheese pizza",

                category: "Pizza",

                basePrice: 299,

                available: true,

                preparationTime: 20,

                keywords: [
                    "pizza",
                    "cheese",
                    "veg",
                    "italian"
                ],

                modifierGroups: [
                    {
                        name: "Size",

                        required: true,

                        multiple: false,

                        minSelection: 1,

                        maxSelection: 1,

                        options: [
                            {
                                name: "Small",
                                price: 0
                            },
                            {
                                name: "Medium",
                                price: 80
                            },
                            {
                                name: "Large",
                                price: 150
                            }
                        ]
                    },
                    {
                        name: "Extra Toppings",

                        required: false,

                        multiple: true,

                        minSelection: 0,

                        maxSelection: 5,

                        options: [
                            {
                                name: "Extra Cheese",
                                price: 40
                            },
                            {
                                name: "Olives",
                                price: 30
                            },
                            {
                                name: "Jalapenos",
                                price: 30
                            }
                        ]
                    }
                ]
            },
            {
                restaurantId: restaurant._id,

                name: "Chicken Combo",

                category: "Combos",

                basePrice: 399,

                available: true,

                keywords: [
                    "combo",
                    "burger",
                    "fries"
                ],

                modifierGroups: [
                    {
                        name: "Entree",

                        required: true,

                        multiple: false,

                        minSelection: 1,

                        maxSelection: 1,

                        options: [
                            {
                                name: "Burger",

                                price: 0,

                                modifierGroups: [
                                    {
                                        name: "Patty",

                                        required: true,

                                        multiple: false,

                                        minSelection: 1,

                                        maxSelection: 1,

                                        options: [
                                            {
                                                name: "Grilled Chicken",
                                                price: 0
                                            },
                                            {
                                                name: "Crispy Chicken",
                                                price: 30
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                name: "Wrap",
                                price: 0
                            }
                        ]
                    },
                    {
                        name: "Side",

                        required: true,

                        multiple: false,

                        minSelection: 1,

                        maxSelection: 1,

                        options: [
                            {
                                name: "Fries",
                                price: 0
                            },
                            {
                                name: "Salad",
                                price: 20
                            }
                        ]
                    }
                ]
            }
        ]);

        console.log("Menu seeded");

        console.log("Database Seeded Successfully");

        process.exit(0);
    } catch (err) {
        console.error(err);

        process.exit(1);
    }
}

seed();