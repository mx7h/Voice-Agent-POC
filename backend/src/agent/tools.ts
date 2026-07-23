

// import { llm } from "@livekit/agents";
// import { z } from "zod";

// import { AgentFunctions } from "./functions.js";

// const selectedModifierSchema = z.object({
//     groupName: z
//         .string()
//         .min(1)
//         .describe("Modifier group name from getMenuItem."),

//     name: z
//         .string()
//         .min(1)
//         .describe("Selected option name from getMenuItem."),
// });

// export function createAgentTools(functions: AgentFunctions) {
//     return [
//         llm.tool({
//             name: "listMenu",

//             description:
//                 "List available menu items with id, name, and price.",

//             parameters: z.object({}),

//             execute: async () => {
//                 console.log("[TOOL] listMenu");
//                 return functions.listMenu();
//             },
//         }),

//         llm.tool({
//             name: "getMenuItem",

//             description:
//                 "Get one menu item's details and required modifier choices. Call this before addToCart.",

//             parameters: z.object({
//                 menuId: z
//                     .string()
//                     .min(1)
//                     .describe("Menu item id from listMenu."),
//             }),

//             execute: async ({ menuId }) => {
//                 console.log("[TOOL] getMenuItem", { menuId });
//                 return functions.getMenuItem(menuId);
//             },
//         }),

//         llm.tool({
//             name: "searchMenu",

//             description:
//                 "Search available menu items by customer words like chicken, burger, fries, combo, drink, or dessert. Returns menu ids to use with getMenuItem.",

//             parameters: z.object({
//                 query: z
//                     .string()
//                     .min(1)
//                     .describe("Customer search query, for example chicken combo or burger."),
//             }),

//             execute: async ({ query }) => {
//                 console.log("[TOOL] searchMenu", { query });
//                 return functions.searchMenu(query);
//             },
//         }),

//         llm.tool({
//             name: "getCart",

//             description:
//                 "Get current cart items and total. Use before confirming order.",

//             parameters: z.object({}),

//             execute: async () => {
//                 console.log("[TOOL] getCart");
//                 return functions.getCart();
//             },
//         }),

//         llm.tool({
//             name: "addToCart",
//             description:
//                 "Add item to cart. Use only after getMenuItem. Include all required modifiers. Quantity should be a number. selectedModifiers should be an array.",
//             parameters: z.object({
//                 menuId: z
//                     .string()
//                     .min(1)
//                     .describe("Menu item id from getMenuItem."),

//                 quantity: z
//                     .union([z.number(), z.string()])
//                     .describe("Quantity to add. Prefer a JSON number like 1, not a string."),

//                 selectedModifiers: z
//                     .union([
//                         z.array(selectedModifierSchema),
//                         z.string(),
//                     ])
//                     .describe(
//                         'Selected modifiers. Prefer JSON array like [{"groupName":"Size","name":"Small"}]. Do not send a quoted JSON string.',
//                     ),
//             }),
//             execute: async ({
//                 menuId,
//                 quantity,
//                 selectedModifiers,
//             }) => {
//                 console.log("[TOOL] addToCart raw", {
//                     menuId,
//                     quantity,
//                     selectedModifiers,
//                 });

//                 const normalizedQuantity = Number(quantity);

//                 let normalizedModifiers: {
//                     groupName: string;
//                     name: string;
//                 }[] = [];

//                 if (Array.isArray(selectedModifiers)) {
//                     normalizedModifiers = selectedModifiers;
//                 } else {
//                     try {
//                         const parsed = JSON.parse(selectedModifiers);

//                         normalizedModifiers = Array.isArray(parsed)
//                             ? parsed
//                             : [];
//                     } catch {
//                         normalizedModifiers = [];
//                     }
//                 }

//                 console.log("[TOOL] addToCart normalized", {
//                     menuId,
//                     quantity: normalizedQuantity,
//                     selectedModifiers: normalizedModifiers,
//                 });

//                 return functions.addToCart({
//                     menuId,
//                     quantity: normalizedQuantity,
//                     selectedModifiers: normalizedModifiers,
//                 });
//             },
//         }),

//         llm.tool({
//             name: "placeOrder",

//             description:
//                 "Place order only after getCart and clear customer confirmation.",

//             parameters: z.object({
//                 confirmed: z
//                     .boolean()
//                     .describe(
//                         "True only after customer confirms final cart and total.",
//                     ),
//             }),

//             execute: async ({ confirmed }) => {
//                 console.log("[TOOL] placeOrder", { confirmed });

//                 return functions.placeOrder({
//                     confirmed,
//                 });
//             },
//         }),
//     ];
// }

// export type AgentTools = ReturnType<typeof createAgentTools>;


import { llm } from "@livekit/agents";
import { z } from "zod";

import { AgentFunctions } from "./functions.js";

const selectedModifierSchema = z.object({
    groupName: z.string().min(1).describe("Modifier group."),
    name: z.string().min(1).describe("Selected option."),
});

/**
 * Removes repeated nestedRule text while preserving the modifier structure.
 */
function compactModifierGroups(groups: any[] = []): any[] {
    return groups.map((group: any) => ({
        g: group.g,
        req: group.req,
        multi: group.multi,
        min: group.min,
        max: group.max,

        opts: (group.opts ?? []).map((option: any) => ({
            n: option.n,
            p: option.p,
            mods: compactModifierGroups(option.mods ?? []),
        })),
    }));
}

/**
 * listMenu/searchMenu only need id, name and price.
 */
function compactMenuItems(items: any[] = []) {
    return items.map((item: any) => ({
        id: item.id,
        n: item.n,
        price: item.price,
    }));
}

export function createAgentTools(functions: AgentFunctions) {
    return [
        llm.tool({
            name: "listMenu",

            description: "List available menu items.",

            parameters: z.object({}),

            execute: async () => {
                console.log("[TOOL] listMenu");

                const result = await functions.listMenu();

                if (!result.success) {
                    return result;
                }

                const data = result.data as any;

                return {
                    success: true,
                    items: compactMenuItems(data?.items ?? []),
                };
            },
        }),

        llm.tool({
            name: "getMenuItem",

            description: "Get item price and modifiers before addToCart.",

            parameters: z.object({
                menuId: z.string().min(1).describe("Menu item id."),
            }),

            execute: async ({ menuId }) => {
                console.log("[TOOL] getMenuItem", { menuId });

                const result = await functions.getMenuItem(menuId);

                if (!result.success) {
                    return result;
                }

                const item = result.data as any;

                if (!item) {
                    return result;
                }

                return {
                    success: true,
                    id: item.id,
                    n: item.n,
                    price: item.price,
                    mods: compactModifierGroups(item.mods ?? []),
                };
            },
        }),

        llm.tool({
            name: "searchMenu",

            description: "Find menu items by name or keyword.",

            parameters: z.object({
                query: z.string().min(1).describe("Menu search text."),
            }),

            execute: async ({ query }) => {
                console.log("[TOOL] searchMenu", { query });

                const result = await functions.searchMenu(query);

                if (!result.success) {
                    return result;
                }

                const data = result.data as any;

                return {
                    success: true,
                    items: compactMenuItems(data?.items ?? []),
                };
            },
        }),

        llm.tool({
            name: "getCart",

            description: "Get cart items and totals.",

            parameters: z.object({}),

            execute: async () => {
                console.log("[TOOL] getCart");

                const result = await functions.getCart();

                if (!result.success) {
                    return result;
                }

                const cart = result.data as any;

                return {
                    success: true,
                    items: cart?.items ?? [],
                    subtotal: Number(cart?.subtotal ?? 0),
                    tax: Number(cart?.tax ?? 0),
                    total: Number(cart?.total ?? 0),
                };
            },
        }),

        llm.tool({
            name: "addToCart",

            description: "Add an item with all required modifiers.",

            parameters: z.object({
                menuId: z.string().min(1).describe("Menu item id."),

                quantity: z
                    .union([z.number(), z.string()])
                    .describe("Positive whole number."),

                selectedModifiers: z
                    .union([z.array(selectedModifierSchema), z.string()])
                    .describe('Array of {"groupName","name"}.'),
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

                const result = await functions.addToCart({
                    menuId,
                    quantity: normalizedQuantity,
                    selectedModifiers: normalizedModifiers,
                });

                /*
                 * Preserve detailed failure data because it may contain
                 * missingModifierGroups needed by the model.
                 */
                if (!result.success) {
                    return result;
                }

                const data = result.data as any;

                return {
                    success: true,
                    message: result.message,
                    total: Number(data?.total ?? 0),
                };
            },
        }),

        llm.tool({
            name: "placeOrder",

            description: "Place the confirmed order.",

            parameters: z.object({
                confirmed: z
                    .boolean()
                    .describe("True after final customer confirmation."),
            }),

            execute: async ({ confirmed }) => {
                console.log("[TOOL] placeOrder", { confirmed });

                const result = await functions.placeOrder({
                    confirmed,
                });

                if (!result.success) {
                    return result;
                }

                const data = result.data as any;

                return {
                    success: true,
                    message: result.message,
                    orderNumber: data?.orderNumber,
                    total: Number(data?.total ?? 0),
                };
            },
        }),
    ];
}

export type AgentTools = ReturnType<typeof createAgentTools>;