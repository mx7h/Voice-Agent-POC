import { Types } from "mongoose";
import {
    cartService,
    menuService,
    orderService,
    restaurantService,
    sessionService,
} from "../services/index.js";
import { ApiError } from "../utils/ApiError.js";

export interface SelectedModifier {

    groupName: string;
    name: string;
    modifierOptionId?: string;
    optionName?: string;
}

export interface AddToCartInput {
    menuId: string;
    quantity: number;
    selectedModifiers?: SelectedModifier[];
}

export interface PlaceOrderInput {
    confirmed: boolean;
}

export interface AgentFunctionContext {
    sessionId: string;
}

export interface AgentFunctionResult<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
}

export class AgentFunctions {
    constructor(
        private readonly context: AgentFunctionContext,
    ) { }

    async getRestaurant(): Promise<AgentFunctionResult> {
        return this.executeSafely(async () => {
            const restaurant =
                await restaurantService.getRestaurant();

            return {
                success: true,
                message: "Restaurant information loaded.",
                data: {
                    name: restaurant.name,
                    address: restaurant.address,
                    phone: restaurant.phone,
                    isOpen: Boolean(restaurant.isOpen),
                    openingHours: restaurant.openingHours,
                },
            };
        });
    }

    async listMenu(): Promise<AgentFunctionResult> {
        return this.executeSafely(async () => {
            const items =
                await menuService.getAvailableItems();

            return {
                success: true,
                message:
                    items.length > 0
                        ? `${items.length} menu items are available.`
                        : "No menu items are currently available.",
                data: {
                    items: items.map((item: any) =>
                        this.formatMenuSummary(item),
                    ),
                },
            };
        });
    }

    async getMenuItem(
        menuId: string,
    ): Promise<AgentFunctionResult> {
        return this.executeSafely(async () => {
            const item =
                await menuService.getMenuById(menuId);

            return {
                success: true,
                message: `${item.name} details loaded.`,
                data: this.formatMenuItem(item),
            };
        });
    }

    // async searchMenu(
    //     query: string,
    // ): Promise<AgentFunctionResult> {
    //     return this.executeSafely(async () => {
    //         const items =
    //             await menuService.searchMenu(query);

    //         return {
    //             success: true,
    //             message:
    //                 items.length > 0
    //                     ? `${items.length} matching items found.`
    //                     : "No matching menu items were found.",
    //             data: {
    //                 items: items.map((item: any) =>
    //                     this.formatMenuSummary(item),
    //                 ),
    //             },
    //         };
    //     });
    // }

    // async getMenuByCategory(
    //     category: string,
    // ): Promise<AgentFunctionResult> {
    //     return this.executeSafely(async () => {
    //         const items =
    //             await menuService.getMenuByCategory(
    //                 category,
    //             );

    //         return {
    //             success: true,
    //             message: `${items.length} items found in ${category}.`,
    //             data: {
    //                 items: items.map((item: any) =>
    //                     this.formatMenuSummary(item),
    //                 ),
    //             },
    //         };
    //     });
    // }

    async getCart(): Promise<AgentFunctionResult> {
        return this.executeSafely(async () => {
            const cart = await cartService.getCart(
                this.context.sessionId,
            );

            if (!cart.items.length) {
                return {
                    success: true,
                    message: "The cart is empty.",
                    data: {
                        items: [],
                        subtotal: 0,
                        tax: 0,
                        total: 0,
                    },
                };
            }

            return {
                success: true,
                message: `${cart.items.length} cart items found.`,
                data: this.formatCart(cart),
            };
        });
    }

    async addToCart(
        input: AddToCartInput,
    ): Promise<AgentFunctionResult> {
        return this.executeSafely(async () => {
            const quantity = input.quantity ?? 1;

            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                return {
                    success: false,
                    message:
                        "Quantity must be a positive whole number.",
                };
            }

            const menuItem =
                await menuService.getMenuById(
                    input.menuId,
                );

            if (menuItem.available !== true) {
                return {
                    success: false,
                    message: `${menuItem.name} is currently unavailable.`,
                };
            }

            const requestedModifiers =
                input.selectedModifiers ?? [];

            const missingRequiredGroups = (
                menuItem.modifierGroups ?? []
            ).filter((group: any) => {
                if (group.required !== true) {
                    return false;
                }

                const selectionsForGroup =
                    requestedModifiers.filter(
                        (modifier) =>
                            this.normalize(modifier.groupName) ===
                            this.normalize(group.name),
                    );

                const minSelection = Number(
                    group.minSelection ?? 1,
                );

                return (
                    selectionsForGroup.length <
                    minSelection
                );
            });

            if (missingRequiredGroups.length > 0) {
                return {
                    success: false,
                    message:
                        "Ask the customer to select the required options before adding this item.",
                    data: {
                        requiresCustomerInput: true,
                        missingModifierGroups:
                            missingRequiredGroups.map(
                                (group: any) => ({
                                    groupName: String(group.name),
                                    required: true,
                                    multiple: Boolean(group.multiple),
                                    minSelection: Number(
                                        group.minSelection ?? 1,
                                    ),
                                    maxSelection: Number(
                                        group.maxSelection ?? 1,
                                    ),
                                    choices: (
                                        group.options ?? []
                                    )
                                        .filter(
                                            (option: any) =>
                                                option.available !== false,
                                        )
                                        .map((option: any) => ({
                                            name: String(option.name),
                                            additionalPrice: Number(
                                                option.price ?? 0,
                                            ),
                                        })),
                                }),
                            ),
                    },
                };
            }

            const resolvedModifiers =
                requestedModifiers.map(
                    (selectedModifier) => {
                        const modifierGroup =
                            menuItem.modifierGroups?.find(
                                (group: any) =>
                                    this.normalize(group.name) ===
                                    this.normalize(
                                        selectedModifier.groupName,
                                    ),
                            );

                        if (!modifierGroup) {
                            throw new Error(
                                `Modifier group "${selectedModifier.groupName}" is not available for ${menuItem.name}.`,
                            );
                        }

                        const modifierOption =
                            modifierGroup.options?.find(
                                (option: any) =>
                                    option.available !== false &&
                                    this.normalize(option.name) ===
                                    this.normalize(
                                        selectedModifier.name,
                                    ),
                            );

                        if (!modifierOption) {
                            throw new Error(
                                `"${selectedModifier.name}" is not a valid option for ${modifierGroup.name}.`,
                            );
                        }


                        return {
                            modifierOptionId: String(
                                modifierOption._id ?? new Types.ObjectId(),
                            ),

                            groupName: String(modifierGroup.name),

                            optionName: String(modifierOption.name),

                            // keep name also because your cart/format logic uses name
                            name: String(modifierOption.name),

                            price: Number(modifierOption.price ?? 0),
                        };
                    },
                );

            const cart = await cartService.addToCart(
                this.context.sessionId,
                input.menuId,
                quantity,
                resolvedModifiers,
            );

            return {
                success: true,
                message: `${quantity} ${menuItem.name} added to the cart.`,
                data: {
                    addedItem: {
                        name: menuItem.name,
                        quantity,
                        modifiers: resolvedModifiers.map(
                            (modifier) => ({
                                groupName: modifier.groupName,
                                name: modifier.name,
                                optionName: modifier.optionName,
                                modifierOptionId: modifier.modifierOptionId,
                            }),
                        ),
                    },
                    cart: this.formatCart(cart),
                },
            };
        });
    }

    async removeFromCart(
        cartItemId: string,
    ): Promise<AgentFunctionResult> {
        return this.executeSafely(async () => {
            const currentCart =
                await cartService.getCart(
                    this.context.sessionId,
                );

            const existingItem =
                currentCart.items.find(
                    (item: any) =>
                        item.cartItemId === cartItemId,
                );

            if (!existingItem) {
                return {
                    success: false,
                    message:
                        "That item was not found in the cart.",
                };
            }

            const cart =
                await cartService.removeFromCart(
                    this.context.sessionId,
                    cartItemId,
                );

            return {
                success: true,
                message: `${existingItem.itemName} removed from the cart.`,
                data: this.formatCart(cart),
            };
        });
    }

    async clearCart(): Promise<AgentFunctionResult> {
        return this.executeSafely(async () => {
            const cart =
                await cartService.clearCart(
                    this.context.sessionId,
                );

            return {
                success: true,
                message: "The cart has been cleared.",
                data: this.formatCart(cart),
            };
        });
    }

    async setCustomerDetails(): Promise<AgentFunctionResult> {
        return this.executeSafely(async () => {
            const customer = {
                name: "Mohit",
                phone: "1234567890",
                email: "mohit@example.com",
            };

            await sessionService.updateSession(
                this.context.sessionId,
                {
                    customer,
                },
            );

            return {
                success: true,
                message: "Customer details saved.",
            };
        });
    }

    async placeOrder(
        input: PlaceOrderInput,
    ): Promise<AgentFunctionResult> {
        return this.executeSafely(async () => {
            if (input.confirmed !== true) {
                return {
                    success: false,
                    message:
                        "The customer must confirm the final order before it can be placed.",
                };
            }

            const cart = await cartService.getCart(
                this.context.sessionId,
            );

            if (!cart.items.length) {
                return {
                    success: false,
                    message:
                        "The cart is empty. Add an item before placing the order.",
                };
            }

            await restaurantService.checkRestaurantOpen();

            await this.setCustomerDetails();

            const order =
                await orderService.placeOrder(
                    this.context.sessionId,
                );

            return {
                success: true,
                message: "The order was placed successfully.",
                data: {
                    orderId: String(order._id),
                    orderNumber: order.orderNumber,
                    status: order.orderStatus,
                    total: Number(order.total),
                },
            };
        });
    }

    async endSession(): Promise<AgentFunctionResult> {
        return this.executeSafely(async () => {
            await sessionService.closeSession(
                this.context.sessionId,
            );

            return {
                success: true,
                message: "The ordering session was closed.",
            };
        });
    }

    private formatMenuSummary(item: any) {
        return {
            id: String(item._id),
            name: String(item.name),
            category: String(item.category),
            price: Number(item.basePrice),
            available: item.available === true,
        };
    }

    private formatMenuItem(item: any) {
        return {
            id: String(item._id),
            name: String(item.name),
            description: String(item.description ?? ""),
            category: String(item.category),
            price: Number(item.basePrice),
            available: item.available === true,

            hasRequiredModifiers: (
                item.modifierGroups ?? []
            ).some(
                (group: any) =>
                    group.required === true,
            ),

            modifierGroups: (
                item.modifierGroups ?? []
            ).map((group: any) => ({
                groupName: String(group.name),
                required: group.required === true,
                multiple: group.multiple === true,
                minSelection: Number(
                    group.minSelection ??
                    (group.required ? 1 : 0),
                ),
                maxSelection: Number(
                    group.maxSelection ?? 1,
                ),

                choices: (
                    group.options ?? []
                )
                    .filter(
                        (option: any) =>
                            option.available !== false,
                    )
                    .map((option: any) => ({
                        name: String(option.name),
                        additionalPrice: Number(
                            option.price ?? 0,
                        ),
                    })),
            })),
        };
    }

    private formatCart(cart: any) {
        return {
            items: (cart.items ?? []).map(
                (item: any) => ({
                    cartItemId: String(
                        item.cartItemId,
                    ),
                    name: String(item.itemName),
                    quantity: Number(item.quantity),
                    modifiers: (
                        item.selectedModifiers ?? []
                    ).map((modifier: any) => ({
                        groupName: String(
                            modifier.groupName,
                        ),
                        name: String(modifier.name),
                    })),
                    totalPrice: Number(
                        item.totalPrice,
                    ),
                }),
            ),

            subtotal: Number(cart.subtotal ?? 0),
            tax: Number(cart.tax ?? 0),
            total: Number(cart.total ?? 0),
        };
    }

    private normalize(value: unknown) {
        return String(value)
            .trim()
            .toLowerCase();
    }

    private async executeSafely(
        action: () => Promise<AgentFunctionResult>,
    ): Promise<AgentFunctionResult> {
        try {
            return await action();
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                console.error("[AGENT API ERROR]", error.message);

                return {
                    success: false,
                    message: error.message,
                };
            }

            if (error instanceof Error) {
                console.error("[AGENT ERROR]", error.message);

                return {
                    success: false,
                    message: error.message,
                };
            }

            console.error("[AGENT UNKNOWN ERROR]", error);

            return {
                success: false,
                message: "The requested action could not be completed.",
            };
        }
    }
}