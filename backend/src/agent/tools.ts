

import { llm } from "@livekit/agents";
import { z } from "zod";

import { AgentFunctions } from "./functions.js";

const selectedModifierSchema = z.object({
    groupName: z
        .string()
        .min(1)
        .describe("Modifier group name from getMenuItem."),

    name: z
        .string()
        .min(1)
        .describe("Selected option name from getMenuItem."),
});

export function createAgentTools(functions: AgentFunctions) {
    return [
        llm.tool({
            name: "listMenu",

            description:
                "List available menu items with id, name, and price.",

            parameters: z.object({}),

            execute: async () => {
                console.log("[TOOL] listMenu");
                return functions.listMenu();
            },
        }),

        llm.tool({
            name: "getMenuItem",

            description:
                "Get one menu item's details and required modifier choices. Call this before addToCart.",

            parameters: z.object({
                menuId: z
                    .string()
                    .min(1)
                    .describe("Menu item id from listMenu."),
            }),

            execute: async ({ menuId }) => {
                console.log("[TOOL] getMenuItem", { menuId });
                return functions.getMenuItem(menuId);
            },
        }),

        llm.tool({
            name: "getCart",

            description:
                "Get current cart items and total. Use before confirming order.",

            parameters: z.object({}),

            execute: async () => {
                console.log("[TOOL] getCart");
                return functions.getCart();
            },
        }),

        llm.tool({
            name: "addToCart",
            description:
                "Add item to cart. Use only after getMenuItem. Include all required modifiers. Quantity should be a number. selectedModifiers should be an array.",
            parameters: z.object({
                menuId: z
                    .string()
                    .min(1)
                    .describe("Menu item id from getMenuItem."),

                quantity: z
                    .union([z.number(), z.string()])
                    .describe("Quantity to add. Prefer a JSON number like 1, not a string."),

                selectedModifiers: z
                    .union([
                        z.array(selectedModifierSchema),
                        z.string(),
                    ])
                    .describe(
                        'Selected modifiers. Prefer JSON array like [{"groupName":"Size","name":"Small"}]. Do not send a quoted JSON string.',
                    ),
            }),
            execute: async ({
                menuId,
                quantity,
                selectedModifiers,
            }) => {
                console.log("[TOOL] addToCart raw", {
                    menuId,
                    quantity,
                    selectedModifiers,
                });

                const normalizedQuantity = Number(quantity);

                let normalizedModifiers: {
                    groupName: string;
                    name: string;
                }[] = [];

                if (Array.isArray(selectedModifiers)) {
                    normalizedModifiers = selectedModifiers;
                } else {
                    try {
                        const parsed = JSON.parse(selectedModifiers);

                        normalizedModifiers = Array.isArray(parsed)
                            ? parsed
                            : [];
                    } catch {
                        normalizedModifiers = [];
                    }
                }

                console.log("[TOOL] addToCart normalized", {
                    menuId,
                    quantity: normalizedQuantity,
                    selectedModifiers: normalizedModifiers,
                });

                return functions.addToCart({
                    menuId,
                    quantity: normalizedQuantity,
                    selectedModifiers: normalizedModifiers,
                });
            },
        }),

        llm.tool({
            name: "placeOrder",

            description:
                "Place order only after getCart and clear customer confirmation.",

            parameters: z.object({
                confirmed: z
                    .boolean()
                    .describe(
                        "True only after customer confirms final cart and total.",
                    ),
            }),

            execute: async ({ confirmed }) => {
                console.log("[TOOL] placeOrder", { confirmed });

                return functions.placeOrder({
                    confirmed,
                });
            },
        }),
    ];
}

export type AgentTools = ReturnType<typeof createAgentTools>;