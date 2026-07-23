# Demo Script

## 1. Demo Goal

Demonstrate the complete AI restaurant ordering workflow in approximately three to five minutes:

```text
Voice input
→ Speech-to-text
→ LLM reasoning
→ Tool execution
→ Live cart update
→ Order confirmation
→ Orders dashboard
→ Analytics dashboard
```

---

## 2. Suggested Demo Conversation

Use an item that has required and optional modifiers.

Example:

```text
Customer:
What is available on the menu?

Agent:
Reads the available menu items.

Customer:
I would like one Margherita Pizza.

Agent:
Which size would you like: Small, Medium, or Large?
Would you like Extra Cheese, Olives, Jalapenos, or no toppings?

Customer:
Medium with Extra Cheese.

Agent:
Confirms that the item was added and asks whether anything else is needed.

Customer:
What is currently in my cart?

Agent:
Summarizes the selected item, modifiers, and total.

Customer:
Place my order.

Agent:
Requests clear final confirmation.

Customer:
Yes, confirm the order.

Agent:
Confirms the successful order and gives the order number.
```

Use the exact available menu names and modifier choices from your deployed database.

---
