# Stripe Integration Plan

## Overview
This document outlines the end-to-end architecture and implementation steps for integrating Stripe payment processing into BuildFlow. This plan transitions the platform from a mocked payment state to a production-ready (test mode) payment gateway.

## Core Decisions (From /grill-me session)
1. **Frontend Flow**: Embed Stripe Elements directly into the checkout UI (avoiding redirects).
2. **Backend Webhooks**: Use Stripe Webhooks to securely update order statuses asynchronously.
3. **Resilience / Demo Mode**: Implement a "Bypass Payment" UI fallback for when Stripe keys are missing or the API is unreachable.
4. **Keys Management**: Use standard test placeholders (`pk_test_...`, `sk_test_...`) to be configured in `.env` later.

---

## 1. Backend Implementation (Node.js/Express)

### A. Environment Setup
- Add placeholders to `backend/.env`:
  ```env
  STRIPE_SECRET_KEY=sk_test_placeholder
  STRIPE_WEBHOOK_SECRET=whsec_placeholder
  ```

### B. Webhook Endpoint Configuration
- **Critical Requirement**: Stripe webhooks require the raw request body to verify cryptographic signatures.
- **Action**: In `backend/src/server.js`, mount the webhook route *before* the global `express.json()` middleware is applied.
  ```javascript
  // server.js
  const stripeWebhookRoutes = require('./routes/webhooks');
  
  // Must be before express.json()
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRoutes);
  
  // Global middlewares
  app.use(express.json());
  ```

### C. Webhook Controller Logic
- Create `backend/src/controllers/webhookController.js`.
- Listen for the `payment_intent.succeeded` event.
- Extract the `orderId` or `userId` from the intent metadata.
- Find the corresponding `Order` in MongoDB and update its status from `Pending` to `Payment Confirmed` or `Warehouse Allocating`.
- Clear the user's cart upon successful payment.

### D. Order Controller Refactor (`orderController.js`)
- Update `exports.checkout` to properly handle Stripe errors.
- If `stripe.paymentIntents.create` fails (e.g., due to missing keys), fallback to returning `clientSecret: 'mock_secret'`.
- Remove manual cart clearing and status updates from the synchronous checkout route; delegate these to the webhook.

---

## 2. Frontend Implementation (React/Vite)

### A. Dependencies
- Install Stripe React libraries:
  ```bash
  npm install @stripe/stripe-js @stripe/react-stripe-js
  ```
- Add placeholder to `frontend/.env`:
  ```env
  VITE_STRIPE_PUBLIC_KEY=pk_test_placeholder
  ```

### B. Checkout UI Integration
- Wrap the checkout component (e.g., `CheckoutModal.jsx` or equivalent) with the Stripe `Elements` provider.
- Inject the `clientSecret` returned from the backend `POST /api/orders/checkout` into the `Elements` provider.
- Replace the current mock payment button with the Stripe `<CardElement />`.

### C. Demo Mode / Fallback Handling
- Before rendering the `<CardElement />`, check the value of `clientSecret`.
- If `clientSecret === 'mock_secret'`:
  - Do NOT render the Stripe Elements (this prevents a crash).
  - Render a prominent **"Bypass Payment (Demo Mode)"** button.
  - When clicked, this button should hit a manual `/api/orders/confirm-mock` endpoint to forcefully progress the order status (simulating a successful webhook).
- If `clientSecret` is valid:
  - Render standard Stripe Elements.
  - On submit, call `stripe.confirmCardPayment()`.

---

## 3. Testing & Verification Steps

1. **Missing Keys (Demo Mode)**: 
   - Leave `.env` with placeholder keys.
   - Attempt checkout. 
   - Verify that the "Bypass Payment" button appears and successfully completes the order.
2. **Real Test Keys (Happy Path)**:
   - Insert actual Stripe test keys into `.env`.
   - Attempt checkout.
   - Verify the Stripe Card Element renders.
   - Enter standard Stripe test card (`4242 4242...`).
   - Verify the backend webhook receives the event and updates the MongoDB order status.
