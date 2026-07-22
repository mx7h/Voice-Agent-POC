import { Types } from "mongoose";

import {
    analyticsService,
    cartService,
    menuService,
    orderService,
    restaurantService,
    sessionService,
} from "../services/index.js";

export interface SelectedModifier {
    groupName: string;
    name: string;
    modifierOptionId?: string;
    optionName?: string;
    price?: number;
}

export interface AddToCartInput {
    menuId: string;
    quantity: number | string;
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
    constructor(private readonly context: AgentFunctionContext) { }

    private get sessionId() {
        return this.context.sessionId;
    }

    async getRestaurant(): Promise<AgentFunctionResult> {
        return this.executeSafely("getRestaurant", async () => {
            const restaurant = await restaurantService.getRestaurant();

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
        return this.executeSafely("listMenu", async () => {
            const items = await menuService.getAvailableItems();

            return {
                success: true,
                message:
                    items.length > 0
                        ? `${items.length} menu items are available.`
                        : "No menu items are currently available.",
                data: {
                    items: items.map((item: any) => this.formatMenuSummary(item)),
                },
            };
        });
    }

    async getMenuItem(menuId: string): Promise<AgentFunctionResult> {
        return this.executeSafely("getMenuItem", async () => {
            const value = String(menuId ?? "").trim();

            if (!value) {
                return {
                    success: false,
                    message: "Menu item id or name is required.",
                };
            }

            const isMongoId = /^[a-f\d]{24}$/i.test(value);

            const item = isMongoId
                ? await menuService.getMenuById(value)
                : await menuService.findMenuByName(value);

            return {
                success: true,
                message: `${item.name} details loaded.`,
                data: this.formatMenuItem(item),
            };
        });
    }

    async searchMenu(query: string): Promise<AgentFunctionResult> {
        return this.executeSafely("searchMenu", async () => {
            const items = await menuService.searchMenu(query);

            return {
                success: true,
                message:
                    items.length > 0
                        ? `${items.length} matching menu items found.`
                        : "No matching menu items found.",
                data: {
                    items: items.map((item: any) => this.formatMenuSummary(item)),
                },
            };
        });
    }

    async getCart(): Promise<AgentFunctionResult> {
        return this.executeSafely("getCart", async () => {
            const cart = await cartService.getCart(this.sessionId);

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

    async addToCart(input: AddToCartInput): Promise<AgentFunctionResult> {
        return this.executeSafely("addToCart", async () => {
            const quantity = Number(input.quantity ?? 1);

            if (!Number.isInteger(quantity) || quantity <= 0) {
                return {
                    success: false,
                    message: "Quantity must be a positive whole number.",
                };
            }

            const menuItem = await menuService.getMenuById(input.menuId);

            if (menuItem.available !== true) {
                return {
                    success: false,
                    message: `${menuItem.name} is currently unavailable.`,
                };
            }

            const requestedModifiers = input.selectedModifiers ?? [];

            const missingRequiredGroups = (menuItem.modifierGroups ?? []).filter(
                (group: any) => {
                    if (group.required !== true) return false;

                    const selectionsForGroup = requestedModifiers.filter(
                        (modifier) =>
                            this.normalize(modifier.groupName) === this.normalize(group.name),
                    );

                    const minSelection = Number(group.minSelection ?? 1);

                    return selectionsForGroup.length < minSelection;
                },
            );

            if (missingRequiredGroups.length > 0) {
                return {
                    success: false,
                    message:
                        "Ask the customer to select the required options before adding this item.",
                    data: {
                        requiresCustomerInput: true,
                        missingModifierGroups: missingRequiredGroups.map((group: any) => ({
                            groupName: String(group.name),
                            required: true,
                            multiple: Boolean(group.multiple),
                            minSelection: Number(group.minSelection ?? 1),
                            maxSelection: Number(group.maxSelection ?? 1),
                            choices: (group.options ?? [])
                                .filter((option: any) => option.available !== false)
                                .map((option: any) => ({
                                    name: String(option.name),
                                    additionalPrice: Number(option.price ?? 0),
                                })),
                        })),
                    },
                };
            }

            const resolvedModifiers = requestedModifiers.map((selectedModifier) => {
                const modifierGroup = menuItem.modifierGroups?.find(
                    (group: any) =>
                        this.normalize(group.name) ===
                        this.normalize(selectedModifier.groupName),
                );

                if (!modifierGroup) {
                    throw new Error(
                        `Modifier group "${selectedModifier.groupName}" is not available for ${menuItem.name}.`,
                    );
                }

                const modifierOption = modifierGroup.options?.find(
                    (option: any) =>
                        option.available !== false &&
                        this.normalize(option.name) === this.normalize(selectedModifier.name),
                );

                if (!modifierOption) {
                    throw new Error(
                        `"${selectedModifier.name}" is not a valid option for ${modifierGroup.name}.`,
                    );
                }

                return {
                    modifierOptionId: String(modifierOption._id ?? new Types.ObjectId()),
                    groupName: String(modifierGroup.name),
                    optionName: String(modifierOption.name),
                    name: String(modifierOption.name),
                    price: Number(modifierOption.price ?? 0),
                };
            });

            const cart = await cartService.addToCart(
                this.sessionId,
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
                        modifiers: resolvedModifiers.map((modifier) => ({
                            groupName: modifier.groupName,
                            name: modifier.name,
                            optionName: modifier.optionName,
                            modifierOptionId: modifier.modifierOptionId,
                            price: modifier.price,
                        })),
                    },
                    cart: this.formatCart(cart),
                },
            };
        });
    }

    async removeFromCart(cartItemId: string): Promise<AgentFunctionResult> {
        return this.executeSafely("removeFromCart", async () => {
            const currentCart = await cartService.getCart(this.sessionId);

            const existingItem = currentCart.items.find(
                (item: any) => item.cartItemId === cartItemId,
            );

            if (!existingItem) {
                return {
                    success: false,
                    message: "That item was not found in the cart.",
                };
            }

            const cart = await cartService.removeFromCart(this.sessionId, cartItemId);

            return {
                success: true,
                message: `${existingItem.itemName} removed from the cart.`,
                data: this.formatCart(cart),
            };
        });
    }

    async clearCart(): Promise<AgentFunctionResult> {
        return this.executeSafely("clearCart", async () => {
            const cart = await cartService.clearCart(this.sessionId);

            return {
                success: true,
                message: "The cart has been cleared.",
                data: this.formatCart(cart),
            };
        });
    }

    async placeOrder(input: PlaceOrderInput): Promise<AgentFunctionResult> {
        return this.executeSafely("placeOrder", async () => {
            if (input.confirmed !== true) {
                return {
                    success: false,
                    message:
                        "The customer must confirm the final order before it can be placed.",
                };
            }

            const cart = await cartService.getCart(this.sessionId);

            if (!cart.items.length) {
                return {
                    success: false,
                    message: "The cart is empty. Add an item before placing the order.",
                };
            }

            await restaurantService.checkRestaurantOpen();

            await this.saveCustomerDetails();

            const order = await orderService.placeOrder(this.sessionId);

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
        return this.executeSafely("endSession", async () => {
            await sessionService.closeSession(this.sessionId);

            return {
                success: true,
                message: "The ordering session was closed.",
            };
        });
    }

    private async saveCustomerDetails() {
        const customer = {
            name: "Mohit",
            phone: "1234567890",
            email: "mohit@example.com",
        };

        await sessionService.updateSession(this.sessionId, {
            customer,
        });
    }

    private formatMenuSummary(item: any) {
        return {
            id: String(item._id),
            name: String(item.name),
            category: String(item.category),
            price: this.formatMoney(item.basePrice),
            available: item.available === true,
        };
    }
    private formatMoney(value: unknown) {
        return Number((Number(value ?? 0) / 100).toFixed(2));
    }
    private formatMenuItem(item: any) {
        return {
            id: String(item._id),
            name: String(item.name),
            description: String(item.description ?? ""),
            category: String(item.category),
            price: this.formatMoney(item.basePrice),
            available: item.available === true,
            hasRequiredModifiers: (item.modifierGroups ?? []).some(
                (group: any) => group.required === true,
            ),
            modifierGroups: (item.modifierGroups ?? []).map((group: any) => ({
                groupName: String(group.name),
                required: group.required === true,
                multiple: group.multiple === true,
                minSelection: Number(group.minSelection ?? (group.required ? 1 : 0)),
                maxSelection: Number(group.maxSelection ?? 1),
                choices: (group.options ?? [])
                    .filter((option: any) => option.available !== false)
                    .map((option: any) => ({
                        name: String(option.name),
                        additionalPrice: Number(option.price ?? 0),
                    })),
            })),
        };
    }

    private formatCart(cart: any) {
        return {
            items: (cart.items ?? []).map((item: any) => ({
                cartItemId: String(item.cartItemId),
                name: String(item.itemName),
                quantity: Number(item.quantity),
                modifiers: (item.selectedModifiers ?? []).map((modifier: any) => ({
                    groupName: String(modifier.groupName),
                    name: String(modifier.name ?? modifier.optionName),
                    optionName: String(modifier.optionName ?? modifier.name),
                    price: this.formatMoney(modifier.price ?? 0),
                })),
                totalPrice: this.formatMoney(item.totalPrice),
            })),
            subtotal: this.formatMoney(cart.subtotal ?? 0),
            tax: this.formatMoney(cart.tax ?? 0),
            total: this.formatMoney(cart.total ?? 0),
        };
    }

    private normalize(value: unknown) {
        return String(value).trim().toLowerCase();
    }

    private async executeSafely(
        toolName: string,
        action: () => Promise<AgentFunctionResult>,
    ): Promise<AgentFunctionResult> {
        const startedAt = Date.now();

        try {
            const result = await action();
            const latencyMs = Date.now() - startedAt;

            try {
                await analyticsService.recordToolCall(
                    this.sessionId,
                    toolName,
                    latencyMs,
                    result.success,
                );
            } catch (analyticsError) {
                console.warn("[ANALYTICS TOOL ERROR]", {
                    toolName,
                    analyticsError,
                });
            }

            return result;
        } catch (error) {
            const latencyMs = Date.now() - startedAt;

            try {
                await analyticsService.recordToolCall(
                    this.sessionId,
                    toolName,
                    latencyMs,
                    false,
                );

                await analyticsService.recordError(
                    this.sessionId,
                    error instanceof Error ? error.message : "Unknown tool error",
                );
            } catch (analyticsError) {
                console.warn("[ANALYTICS ERROR RECORD ERROR]", {
                    toolName,
                    analyticsError,
                });
            }

            console.error("[AGENT TOOL ERROR]", {
                toolName,
                error,
            });

            return {
                success: false,
                message:
                    error instanceof Error ? error.message : "Something went wrong",
            };
        }
    }
}