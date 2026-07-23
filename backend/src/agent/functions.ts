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

            const missingRequiredGroups = this.collectMissingRequiredGroups(
                menuItem.modifierGroups ?? [],
                requestedModifiers,
            );

            if (missingRequiredGroups.length > 0) {
                return {
                    success: false,
                    message:
                        "Ask the customer to select the required options before adding this item.",
                    data: {
                        requiresCustomerInput: true,
                        missingModifierGroups: missingRequiredGroups,
                    },
                };
            }

            const resolvedModifiers = this.resolveSelectedModifiers(
                menuItem.modifierGroups ?? [],
                requestedModifiers,
                menuItem.name,
            );
            const cart = await cartService.addToCart(
                this.sessionId,
                input.menuId,
                quantity,
                resolvedModifiers,
            );

            return {
                success: true,
                message: `${quantity} ${menuItem.name} added to cart.`,
                data: {
                    item: menuItem.name,
                    total: this.formatMoney(cart.total),
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
            n: String(item.name),
            cat: String(item.category),
            price: this.formatMoney(item.basePrice),
        };
    }

    private formatMoney(value: unknown) {
        return Number((Number(value ?? 0)));
    }

    private formatMenuItem(item: any) {
        return {
            id: String(item._id),
            n: String(item.name),
            desc: String(item.description ?? ""),
            cat: String(item.category),
            price: this.formatMoney(item.basePrice),
            available: item.available === true,
            hasReqMods: this.hasRequiredModifierGroups(item.modifierGroups ?? []),
            mods: this.formatModifierGroupsCompact(item.modifierGroups ?? []),
        };
    }

    private formatModifierGroupsCompact(groups: any[] = []): any[] {
        return groups.map((group: any) => ({
            g: String(group.name),
            req: group.required === true,
            multi: group.multiple === true,
            min: Number(group.minSelection ?? (group.required ? 1 : 0)),
            max: Number(group.maxSelection ?? 1),
            opts: (group.options ?? [])
                .filter((option: any) => option.available !== false)
                .map((option: any) => {
                    const nestedGroups = this.formatModifierGroupsCompact(
                        option.modifierGroups ?? [],
                    );

                    return {
                        n: String(option.name),
                        p: Number(option.price ?? 0),
                        mods: nestedGroups,
                        nestedRule:
                            nestedGroups.length > 0
                                ? `Ask nested mods only if ${option.name} is selected.`
                                : `No nested mods for ${option.name}.`,
                    };
                }),
        }));
    }

    private hasRequiredModifierGroups(groups: any[] = []): boolean {
        return groups.some((group: any) => {
            if (group.required === true) return true;

            return (group.options ?? []).some((option: any) =>
                this.hasRequiredModifierGroups(option.modifierGroups ?? []),
            );
        });
    }
    private collectMissingRequiredGroups(
        groups: any[] = [],
        requestedModifiers: SelectedModifier[] = [],
    ): any[] {
        const missingGroups: any[] = [];

        for (const group of groups) {
            const selectionsForGroup = requestedModifiers.filter(
                (modifier) =>
                    this.normalize(modifier.groupName) === this.normalize(group.name),
            );

            const minSelection = Number(group.minSelection ?? (group.required ? 1 : 0));

            if (group.required === true && selectionsForGroup.length < minSelection) {
                missingGroups.push(this.formatMissingModifierGroup(group));
                continue;
            }

            for (const selectedModifier of selectionsForGroup) {
                const selectedOption = (group.options ?? []).find(
                    (option: any) =>
                        option.available !== false &&
                        this.normalize(option.name) ===
                        this.normalize(selectedModifier.name ?? selectedModifier.optionName),
                );

                if (!selectedOption) continue;

                const nestedMissingGroups = this.collectMissingRequiredGroups(
                    selectedOption.modifierGroups ?? [],
                    requestedModifiers,
                );

                missingGroups.push(...nestedMissingGroups);
            }
        }

        return missingGroups;
    }

    private formatMissingModifierGroup(group: any) {
        return {
            g: String(group.name),
            req: group.required === true,
            multi: group.multiple === true,
            min: Number(group.minSelection ?? (group.required ? 1 : 0)),
            max: Number(group.maxSelection ?? 1),
            opts: (group.options ?? [])
                .filter((option: any) => option.available !== false)
                .map((option: any) => ({
                    n: String(option.name),
                    p: Number(option.price ?? 0),
                    mods: this.formatModifierGroupsCompact(
                        option.modifierGroups ?? [],
                    ),
                })),
        };
    }

    private resolveSelectedModifiers(
        groups: any[] = [],
        requestedModifiers: SelectedModifier[] = [],
        itemName: string,
    ) {
        const resolvedModifiers: SelectedModifier[] = [];
        const resolvedKeys = new Set<string>();

        const visitGroups = (currentGroups: any[]) => {
            for (const group of currentGroups ?? []) {
                const selectionsForGroup = requestedModifiers.filter(
                    (modifier) =>
                        this.normalize(modifier.groupName) ===
                        this.normalize(group.name),
                );

                const maxSelection = Number(
                    group.maxSelection ?? (group.multiple ? selectionsForGroup.length : 1),
                );

                if (selectionsForGroup.length > maxSelection) {
                    throw new Error(
                        `Too many options selected for ${group.name}. Maximum allowed is ${maxSelection}.`,
                    );
                }

                for (const selectedModifier of selectionsForGroup) {
                    const selectedName = String(
                        selectedModifier.name ?? selectedModifier.optionName ?? "",
                    );

                    const modifierOption = (group.options ?? []).find(
                        (option: any) =>
                            option.available !== false &&
                            this.normalize(option.name) === this.normalize(selectedName),
                    );

                    if (!modifierOption) {
                        throw new Error(
                            `"${selectedName}" is not a valid option for ${group.name}.`,
                        );
                    }

                    const resolved = {
                        modifierOptionId: String(
                            modifierOption._id ?? new Types.ObjectId(),
                        ),
                        groupName: String(group.name),
                        optionName: String(modifierOption.name),
                        name: String(modifierOption.name),
                        price: Number(modifierOption.price ?? 0),
                    };

                    resolvedModifiers.push(resolved);

                    resolvedKeys.add(
                        `${this.normalize(resolved.groupName)}::${this.normalize(
                            resolved.name,
                        )}`,
                    );

                    visitGroups(modifierOption.modifierGroups ?? []);
                }
            }
        };

        visitGroups(groups);

        for (const requestedModifier of requestedModifiers) {
            const requestedName = String(
                requestedModifier.name ?? requestedModifier.optionName ?? "",
            );

            const key = `${this.normalize(requestedModifier.groupName)}::${this.normalize(
                requestedName,
            )}`;

            if (!resolvedKeys.has(key)) {
                throw new Error(
                    `Modifier group "${requestedModifier.groupName}" with option "${requestedName}" is not available for ${itemName}.`,
                );
            }
        }

        return resolvedModifiers;
    }
    private formatCart(cart: any) {
        return {
            items: (cart.items ?? []).map((item: any) => ({
                id: String(item.cartItemId),
                n: String(item.itemName),
                qty: Number(item.quantity),
                mods: (item.selectedModifiers ?? []).map((modifier: any) => ({
                    g: String(modifier.groupName),
                    n: String(modifier.name ?? modifier.optionName),
                    p: this.formatMoney(modifier.price ?? 0),
                })),
                total: this.formatMoney(item.totalPrice),
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