
// import { llm } from "@livekit/agents";
// import { z } from "zod";

// import { AgentFunctions } from "./functions.js";

// /**
//  * Gemini sends modifier names only.
//  * The backend resolves the official modifier prices from MongoDB.
//  */
// const selectedModifierSchema = z.object({
//     groupName: z
//         .string()
//         .min(1)
//         .describe(
//             "Exact modifier group name returned by getMenuItem, such as Size or Crust.",
//         ),

//     name: z
//         .string()
//         .min(1)
//         .describe(
//             "Exact modifier option selected by the customer, such as Large or Thin Crust.",
//         ),
// });

// export function createAgentTools(
//     functions: AgentFunctions,
// ) {
//     return [
//         llm.tool({
//             name: "getRestaurant",

//             description:
//                 "Get the restaurant's current information, including its name, address, opening hours, and whether it is open. Use this whenever the customer asks about the restaurant.",

//             parameters: z.object({}),

//             execute: async () => {
//                 console.log("[TOOL] getRestaurant");

//                 return functions.getRestaurant();
//             },
//         }),

//         llm.tool({
//             name: "listMenu",

//             description:
//                 "Get a lightweight list of all currently available menu items with their IDs, names, categories, and base prices. Use this when the customer asks what is available or asks to hear the menu. Never invent menu items or prices.",

//             parameters: z.object({}),

//             execute: async () => {
//                 console.log("[TOOL] listMenu");

//                 return functions.listMenu();
//             },
//         }),

//         llm.tool({
//             name: "getMenuItem",

//             description: `
// Get complete details for one menu item.

// MANDATORY USE:
// - Always call this tool before addToCart.
// - Inspect the item's availability.
// - Inspect hasRequiredModifiers and modifierGroups.
// - If a modifier group is required, ask the customer to choose from the returned options.
// - Ask one modifier question at a time.
// - Never select a required modifier on behalf of the customer.
// `,

//             parameters: z.object({
//                 menuId: z
//                     .string()
//                     .min(1)
//                     .describe(
//                         "Exact menu item ID returned by listMenu, searchMenu, or getMenuByCategory.",
//                     ),
//             }),

//             execute: async ({ menuId }) => {
//                 console.log("[TOOL] getMenuItem", {
//                     menuId,
//                 });

//                 return functions.getMenuItem(menuId);
//             },
//         }),

//         llm.tool({
//             name: "searchMenu",

//             description:
//                 "Search the real restaurant menu using the customer's words. Use this when the customer asks for a specific item, ingredient, category, or food preference. Only mention items returned by this tool.",

//             parameters: z.object({
//                 query: z
//                     .string()
//                     .min(1)
//                     .describe(
//                         "The customer's search phrase, such as pizza, vegetarian, spicy, burger, dessert, or drink.",
//                     ),
//             }),

//             execute: async ({ query }) => {
//                 console.log("[TOOL] searchMenu", {
//                     query,
//                 });

//                 return functions.searchMenu(query);
//             },
//         }),

//         llm.tool({
//             name: "getMenuByCategory",

//             description:
//                 "Get available items from one menu category. Use only when the customer clearly asks for a category such as pizza, burgers, starters, desserts, or drinks.",

//             parameters: z.object({
//                 category: z
//                     .string()
//                     .min(1)
//                     .describe(
//                         "The exact menu category requested by the customer.",
//                     ),
//             }),

//             execute: async ({ category }) => {
//                 console.log("[TOOL] getMenuByCategory", {
//                     category,
//                 });

//                 return functions.getMenuByCategory(
//                     category,
//                 );
//             },
//         }),

//         llm.tool({
//             name: "getCart",

//             description:
//                 "Get the current session cart with item names, quantities, modifiers, cart item IDs, subtotal, tax, and total. Use this before removing an item, summarizing the cart, or confirming an order.",

//             parameters: z.object({}),

//             execute: async () => {
//                 console.log("[TOOL] getCart");

//                 return functions.getCart();
//             },
//         }),

//         llm.tool({
//             name: "addToCart",

//             description: `
// Add a menu item to the current session cart.

// MANDATORY PROCESS:
// 1. Call getMenuItem first.
// 2. Check whether the item is available.
// 3. Inspect all modifier groups.
// 4. Ask the customer for every required modifier.
// 5. Do not call addToCart until every required modifier has been selected.
// 6. Use the exact menuId, groupName, and option name returned by getMenuItem.
// 7. Never invent modifier names, IDs, prices, or choices.
// 8. For an item with no modifiers, send selectedModifiers as an empty array.
// `,

//             parameters: z.object({
//                 menuId: z
//                     .string()
//                     .min(1)
//                     .describe(
//                         "Exact menu item ID returned by getMenuItem.",
//                     ),

//                 quantity: z
//                     .number()
//                     .int()
//                     .positive()
//                     .describe(
//                         "Positive whole-number quantity requested by the customer.",
//                     ),

//                 selectedModifiers: z
//                     .array(selectedModifierSchema)
//                     .describe(
//                         "All modifier choices selected by the customer. Include every required modifier. Send an empty array only when getMenuItem confirms that the item has no selected modifiers.",
//                     ),
//             }),

//             execute: async ({
//                 menuId,
//                 quantity,
//                 selectedModifiers,
//             }) => {
//                 console.log("[TOOL START] addToCart", {
//                     menuId,
//                     quantity,
//                     selectedModifiers,
//                 });

//                 const result =
//                     await functions.addToCart({
//                         menuId,
//                         quantity,
//                         selectedModifiers,
//                     });

//                 console.log(
//                     "[TOOL END] addToCart",
//                     JSON.stringify(result),
//                 );

//                 return result;
//             },
//         }),

//         llm.tool({
//             name: "removeFromCart",

//             description:
//                 "Remove one complete cart line. Always call getCart first and use the exact cartItemId returned by it. Never use a menuId to remove an item.",

//             parameters: z.object({
//                 cartItemId: z
//                     .string()
//                     .min(1)
//                     .describe(
//                         "Exact cartItemId returned by getCart.",
//                     ),
//             }),

//             execute: async ({ cartItemId }) => {
//                 console.log("[TOOL] removeFromCart", {
//                     cartItemId,
//                 });

//                 return functions.removeFromCart(
//                     cartItemId,
//                 );
//             },
//         }),

//         llm.tool({
//             name: "clearCart",

//             description:
//                 "Remove every item from the current cart. Only use this when the customer clearly asks to clear, empty, cancel, or remove the entire cart.",

//             parameters: z.object({}),

//             execute: async () => {
//                 console.log("[TOOL] clearCart");

//                 return functions.clearCart();
//             },
//         }),

//         llm.tool({
//             name: "placeOrder",

//             description: `
// Place the current cart as an order.

// MANDATORY PROCESS:
// 1. Call getCart first.
// 2. Confirm that the cart is not empty.
// 3. Clearly summarize the final items and total.
// 4. Ask the customer for explicit confirmation.
// 5. Only call placeOrder after the customer clearly confirms the summarized order.
// 6. Never treat an unrelated or earlier "yes" as final confirmation.
// `,

//             parameters: z.object({
//                 confirmed: z
//                     .boolean()
//                     .describe(
//                         "Set to true only after the customer explicitly confirms the final cart summary and total.",
//                     ),
//             }),

//             execute: async ({ confirmed }) => {
//                 console.log("[TOOL START] placeOrder", {
//                     confirmed,
//                 });

//                 const result =
//                     await functions.placeOrder({
//                         confirmed,
//                     });

//                 console.log(
//                     "[TOOL END] placeOrder",
//                     JSON.stringify(result),
//                 );

//                 return result;
//             },
//         }),
//     ];
// }

// export type AgentTools = ReturnType<
//     typeof createAgentTools>

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
                "Add item to cart. Use only after getMenuItem. Include all required modifiers. Use [] if no modifiers.",

            parameters: z.object({
                menuId: z
                    .string()
                    .min(1)
                    .describe("Menu item id from getMenuItem."),

                quantity: z
                    .number()
                    .int()
                    .positive()
                    .describe("Quantity to add."),

                selectedModifiers: z
                    .array(selectedModifierSchema)
                    .describe(
                        "Selected modifiers. Empty array only if item has no required modifiers.",
                    ),
            }),

            execute: async ({
                menuId,
                quantity,
                selectedModifiers,
            }) => {
                console.log("[TOOL] addToCart", {
                    menuId,
                    quantity,
                    selectedModifiers,
                });

                return functions.addToCart({
                    menuId,
                    quantity,
                    selectedModifiers,
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