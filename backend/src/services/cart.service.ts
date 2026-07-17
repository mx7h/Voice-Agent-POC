import { StatusCodes } from "http-status-codes";
import { randomUUID } from "crypto";
import { menuService, sessionService } from "./index.js";
import { ApiError } from "../utils/ApiError.js";
import { emitCartUpdated } from "../socket/socket.events.js";

export class CartService {
    /**
     * Get current cart
     */
    async getCart(sessionId: string) {
        const session = await sessionService.getSession(sessionId);

        return session.cart;
    }

    /**
     * Add item to cart
     */
    async addToCart(
        sessionId: string,
        menuId: string,
        quantity: number,
        selectedModifiers: any[]
    ) {
        const session = await sessionService.getSession(sessionId);

        const menuItem = await menuService.getMenuById(menuId);

        menuService.validateRequiredModifiers(
            menuItem,
            selectedModifiers
        );

        const itemPrice = menuService.calculateItemPrice(
            menuItem,
            selectedModifiers
        );

        // Check if the same menu item with the same modifiers already exists
        const existingItem = session.cart.items.find((item: any) => {
            if (item.menuId.toString() !== menuId.toString()) {
                return false;
            }

            if (item.selectedModifiers.length !== selectedModifiers.length) {
                return false;
            }

            return item.selectedModifiers.every(
                (modifier: any, index: number) =>
                    modifier.name === selectedModifiers[index].name
            );
        });

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.totalPrice = itemPrice * existingItem.quantity;
        } else {
            const cartItem = {
                cartItemId: randomUUID(),
                menuId: menuItem._id,
                itemName: menuItem.name,
                quantity,
                basePrice: menuItem.basePrice,
                selectedModifiers,
                totalPrice: itemPrice * quantity,
            };

            session.cart.items.push(cartItem);
        }

        this.calculateCart(session.cart);

        await sessionService.updateSession(sessionId, {
            cart: session.cart,
        });

        // emitCartUpdated(sessionId, session.cart);
        console.log("[AI CART UPDATED]", {
            sessionId,
            cart: session.cart,
        });
        return session.cart;
    }

    /**
     * Remove item from cart
     */
    async removeFromCart(sessionId: string, cartItemId: string) {
        const session = await sessionService.getSession(sessionId);

        const index = session.cart.items.findIndex(
            (item: any) => item.cartItemId === cartItemId
        );

        if (index < 0 || index >= session.cart.items.length) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid cart item index"
            );
        }

        session.cart.items.splice(index, 1);

        this.calculateCart(session.cart);

        await sessionService.updateSession(sessionId, {
            cart: session.cart,
        });

        emitCartUpdated(sessionId, session.cart);

        return session.cart;
    }

    /**
     * Clear cart
     */
    async clearCart(sessionId: string) {
        const session = await sessionService.getSession(sessionId);

        session.cart = {
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0,
        };

        await sessionService.updateSession(sessionId, {
            cart: session.cart,
        });

        emitCartUpdated(sessionId, session.cart);

        return session.cart;
    }

    /**
     * Recalculate totals
     */
    private calculateCart(cart: any) {
        cart.subtotal = cart.items.reduce(
            (sum: number, item: any) => sum + item.totalPrice,
            0
        );

        cart.tax = Number((cart.subtotal * 0.05).toFixed(2));

        cart.total = cart.subtotal + cart.tax;
    }
}