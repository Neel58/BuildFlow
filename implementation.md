# BuildFlow Backend - Deep Handover & Implementation Guide

Welcome to the BuildFlow Backend! You are taking over a partially completed custom PC building platform. 

**CRITICAL CONTEXT**: You will find a file named `api's.md` in the root of the project. **This file is the ultimate source of truth for the API contract.** Your primary directive is to implement the remaining endpoints exactly as specified in that file. Please check it thoroughly and deeply. Do not deviate from the routes or HTTP methods defined there.

Since you are cloning this repository fresh, here is the context of what has been pushed and what you must build.

---

## 1. Project Context & Current Architecture
**Tech Stack**: Node.js, Express, MongoDB (Mongoose), JWT Auth.
**Core Workflow**: We handle custom PC builds. The system tracks an order through a complex state machine: `Pending -> Payment Verified -> Assembly Queue -> In Assembly -> QA Inspection -> Packaging -> Ready to Ship -> Shipped -> Delivered`.

**What is already built in the cloned code:**
- **Auth**: Basic Register/Login (`auth.js` for JWT, `rbac.js` for role verification).
- **Core Models**: `User`, `Component`, `CustomBuild`, `Cart`, `Order`, `AssemblyTask`, `QATask`, `LogisticsTask`.
- **Checkout & Inventory**: Stripe integration exists. The inventory system is currently implicit (stock is reserved during checkout and deducted when the `LogisticsTask` marks it as `Shipped`).

---

## 2. The API Backlog (Missed Endpoints from Steps 1-8)
During initial sprints, we skipped several endpoints to focus on the core checkout flow. **You must implement these missing endpoints first.** Here is a deep dive into exactly what needs to be implemented for each one.

### Users Module
*Files to modify: `src/routes/users.js` (create if missing), `src/controllers/userController.js`, `src/models/User.js`*

1. **`POST /api/users/password-reset`**
   - **Logic**: Accept `email` in the body. Find the user. Use Node's built-in `crypto` module to generate a random 20-byte hex string. Hash this token and save it to `user.resetPasswordToken` and set `user.resetPasswordExpire` to 10 minutes from now. Return a 200 OK (in a real app, you would send an email here, but for now, just log the token or return it in development).

2. **`PUT /api/users/password-reset/verify`**
   - **Logic**: Accept the raw `token` and `newPassword`. Hash the provided token and find the user where `resetPasswordToken` matches and `resetPasswordExpire` is in the future. If valid, update `user.password` (the pre-save hook will hash it), clear the reset fields, and save.

3. **`GET /api/users/:id`** & **`PUT /api/users/:id`**
   - **Logic**: Standard CRUD. For `PUT`, allow users to update their `name`, `email`, or `address`. Do not allow them to update their `role`.

4. **`GET /api/users` (Admin Only)**
   - **Logic**: Protect with `authorize('Admin')`. Fetch all users. Support a query parameter `?role=Admin` to filter the `find()` query.

5. **`PUT /api/users/:id/role` & `PUT /api/users/:id/deactivate` & `DELETE /api/users/:id` (Admin Only)**
   - **Logic**: Protect with `authorize('Admin')`. 
   - Role: Change `user.role` (e.g., `'Customer'`, `'Admin'`, `'Technician'`).
   - Deactivate: Add an `isActive` boolean to the `User` schema and toggle it to false. Ensure the login route blocks inactive users.
   - Delete: Hard delete `User.findByIdAndDelete()`.

### Builds Module
*Files to modify: `src/controllers/customBuilds.js`*

1. **`GET /api/builds/compare?ids=`**
   - **Logic**: Parse a comma-separated list of `ids` from the query string. Perform a `CustomBuild.find({ _id: { $in: idsArray } }).populate('components')`. Return the array of builds side-by-side so the frontend can compare specs.
   
2. **`POST /api/builds/:id/share`**
   - **Logic**: Fetch the build. Add a boolean `isPublic` (default false) to the `CustomBuild` schema. Set it to `true`. Generate and return a unique URL string (e.g., `https://buildflow.com/shared/build/:id`). Ensure `GET /api/builds/:id` allows unauthenticated access if `isPublic` is true.

### Orders Module
*Files to modify: `src/controllers/orderController.js`*

1. **`GET /api/orders/user/:userId`**
   - **Logic**: `Order.find({ user: req.params.userId }).sort({ createdAt: -1 })`. Return the list.

2. **`GET /api/orders/:id/invoice`**
   - **Logic**: Fetch the order and populate all items. Use a library like `pdfkit` or just return a heavily structured JSON object formatted specifically for invoice rendering on the frontend (including taxes, subtotal, shipping address, date).

3. **`POST /api/orders/:id/reorder`**
   - **Logic**: Fetch the old order. Loop through `order.items`. Automatically push these items into the user's current `Cart` document (creating a cart if it doesn't exist). Return the updated cart.

4. **`PUT /api/orders/:id/state` (Admin Only)**
   - **Logic**: Accept `state` and `reason` in the body. Force update `order.status`. *Crucial*: If bypassing normal flow, you must manually trigger inventory logic if moving from Pending -> Shipped (deduct stock) or Shipped -> Cancelled (restore stock).

5. **`GET /api/orders?status=` (Admin Only)**
   - **Logic**: `Order.find({ status: req.query.status })`.

### Explicit Inventory Module
*Files to create: `src/controllers/inventoryController.js`, `src/routes/inventory.js`*

1. **`GET /api/inventory` & `GET /api/inventory/:componentId`**
   - **Logic**: Query the `Component` model. Return `stock`, `reservedStock`, and `availableStock` (virtual field).
   
2. **`PUT /api/inventory/:componentId/adjust` (Admin Only)**
   - **Logic**: Accept an absolute `newStock` number. Directly update `Component.stock`.

3. **`POST /api/inventory/reserve`, `allocate`, `release` (Admin Only)**
   - **Logic**: These are manual overrides for the warehouse manager. 
   - Reserve: Increment `reservedStock` on a component.
   - Allocate: Decrement both `stock` and `reservedStock` (representing a physical part being picked off the shelf).
   - Release: Decrement `reservedStock` only.

4. **`GET /api/inventory/low-stock`**
   - **Logic**: `Component.find({ stock: { $lt: 10 } })` (or whatever threshold makes sense).

---

## 3. Remaining Core Modules (Steps 9, 10, 11)

### Step 9: Notifications Module
**Files**: `models/Notification.js`, `controllers/notificationController.js`, `routes/notifications.js`
1. **Schema Design**:
   - `user`: ObjectId, ref `'User'`
   - `order`: ObjectId, ref `'Order'` (optional)
   - `type`: String, enum: `['Email', 'SMS', 'In-App']`
   - `message`: String
   - `status`: String, enum: `['Pending', 'Sent', 'Failed']`
2. **`GET /api/notifications/:userId`**: `Notification.find({ user: userId })`.
3. **`POST /api/notifications`**: Accept `userId`, `type`, `message`. Create a Notification record. Simulate sending by setting status to `'Sent'`.
4. **`GET /api/notifications/log/:orderId`**: `Notification.find({ order: orderId })`. Useful for seeing all emails sent regarding a specific order.

### Step 10: Audit Logs Module
**Files**: `models/AuditLog.js`, `controllers/auditLogController.js`, `routes/auditLogs.js`
1. **Schema Design**:
   - `actor`: ObjectId, ref `'User'` (The Admin who did it)
   - `action`: String (e.g., `'STOCK_OVERRIDE'`, `'ROLE_CHANGED'`)
   - `targetId`: String/ObjectId (ID of the modified entity)
   - `changes`: mongoose.Schema.Types.Mixed (Object containing old vs new values)
2. **`POST /api/audit-logs`**: System-only route (or internal function) to append an immutable record. You should call this internally whenever an admin manually overrides a state or stock.
3. **`GET /api/audit-logs`**: Admin only. Searchable by `actor` or `action`.
4. **`GET /api/audit-logs/:id`**: Return detailed diff of `changes`.

### Step 11: Analytics & Reports Module
**Files**: `controllers/analyticsController.js`, `routes/analytics.js`
1. **`GET /api/analytics/dashboard`**: 
   - **Logic**: Use MongoDB Aggregation Pipelines on the `Order` model. 
   - E.g., `$group` by `null` to get total revenue (`$sum: '$totalAmount'`). 
   - `$group` by `status` to get order counts per status. 
   - Return a rich JSON payload: `{ totalRevenue: 50000, activeOrders: 12, completedOrders: 100 }`.
2. **`GET /api/reports/export?type=&format=`**:
   - **Logic**: If `type=orders` and `format=csv`, use a library like `json2csv` to stream all orders back to the client as a `.csv` file attachment. (Set headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="report.csv"`).

---

## 4. How to Run Locally
1. Clone the repository and `cd backend`.
2. Run `npm install`.
3. Start your local MongoDB server (e.g., `mongod`).
4. Create a `.env` file in the `/backend` folder. Copy the contents of `.env.example`. Make sure to set:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/buildflow
   JWT_SECRET=your_super_secret_key_here
   ```
5. Run `npm run dev`.
6. Use Postman to test. You will need to create a user, log in, take the JWT token, and pass it in the `Authorization: Bearer <token>` header for protected routes.
