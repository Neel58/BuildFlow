# BuildFlow — API Design Specification

This is the authoritative API contract for BuildFlow's backend. Implement modules one at a time, in the order listed, and do not deviate from these routes/methods.

## Users
| Method | URL | Description |
|---|---|---|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Authenticate user and return JWT access and refresh token |
| POST | `/api/users/password-reset` | Request password reset link/OTP |
| PUT | `/api/users/password-reset/verify` | Verify OTP/link and update password |
| GET | `/api/users/:id` | Retrieve user profile |
| PUT | `/api/users/:id` | Update user profile |
| GET | `/api/users` | Admin: List all users, filterable by role |
| PUT | `/api/users/:id/role` | Admin: Change user role |
| PUT | `/api/users/:id/deactivate` | Admin: Deactivate user account |
| DELETE | `/api/users/:id` | Admin: Delete user account |

## Components / Catalog
| Method | URL | Description |
|---|---|---|
| GET | `/api/components` | Browse, search, and filter components |
| GET | `/api/components/:id` | Get component specifications, price, and stock |
| POST | `/api/components` | Admin: Create component |
| PUT | `/api/components/:id` | Admin: Update component details |
| DELETE | `/api/components/:id` | Admin: Delete component |

## Builds
| Method | URL | Description |
|---|---|---|
| POST | `/api/builds` | Create build and validate compatibility |
| GET | `/api/builds/:id` | Retrieve build with compatibility status |
| GET | `/api/builds/user/:userId` | List user's saved builds |
| PUT | `/api/builds/:id` | Edit build and re-check compatibility |
| DELETE | `/api/builds/:id` | Delete saved build |
| GET | `/api/builds/compare?ids=` | Compare two or more builds |
| POST | `/api/builds/:id/share` | Generate shareable build link |

## Cart
| Method | URL | Description |
|---|---|---|
| GET | `/api/cart/:userId` | Retrieve current cart |
| POST | `/api/cart/:userId/items` | Add build/component to cart |
| PUT | `/api/cart/:userId/items/:itemId` | Update quantity and re-check stock/compatibility |
| DELETE | `/api/cart/:userId/items/:itemId` | Remove item from cart |

## Orders
| Method | URL | Description |
|---|---|---|
| POST | `/api/orders/checkout` | Submit shipping/payment details and calculate total |
| POST | `/api/orders` | Create order after successful payment |
| GET | `/api/orders/:id` | Get real-time order status |
| GET | `/api/orders/user/:userId` | Get customer's complete order history |
| GET | `/api/orders/:id/invoice` | Download order invoice |
| POST | `/api/orders/:id/reorder` | Reorder a previous order |
| PUT | `/api/orders/:id/state` | Admin: Override order state with reason |
| GET | `/api/orders?status=` | List orders by status |

## Inventory / Warehouse
| Method | URL | Description |
|---|---|---|
| GET | `/api/inventory` | View current stock levels |
| GET | `/api/inventory/:componentId` | View stock for specific component |
| PUT | `/api/inventory/:componentId/adjust` | Warehouse Manager: Adjust stock |
| POST | `/api/inventory/reserve` | Reserve stock for an order |
| POST | `/api/inventory/allocate` | Allocate reserved stock for assembly |
| POST | `/api/inventory/release` | Release reserved stock |
| GET | `/api/inventory/low-stock` | List components below stock threshold |

## Assembly
| Method | URL | Description |
|---|---|---|
| GET | `/api/assembly/queue` | List orders waiting for assembly |
| PUT | `/api/assembly/:orderId/assign` | Assign order to technician |
| POST | `/api/assembly/:orderId/progress` | Record assembly progress |
| PUT | `/api/assembly/:orderId/complete` | Mark assembly complete and notify QA |

## QA / Testing
| Method | URL | Description |
|---|---|---|
| GET | `/api/qa/queue` | List orders awaiting quality testing |
| POST | `/api/qa/:orderId/report` | Record QA testing report |
| PUT | `/api/qa/:orderId/decision` | Mark QA as Passed/Failed |

## Packaging & Shipment
| Method | URL | Description |
|---|---|---|
| POST | `/api/logistics/:orderId/package` | Confirm packaging for QA-passed order |
| POST | `/api/logistics/:orderId/shipment` | Generate shipment and tracking number |
| GET | `/api/logistics/:orderId/tracking` | Get delivery tracking status |
| PUT | `/api/logistics/:orderId/delivery-status` | Update delivery status through courier webhook |
| PUT | `/api/logistics/:orderId/failed-delivery` | Record failed delivery and reschedule/return |

## Notifications
| Method | URL | Description |
|---|---|---|
| GET | `/api/notifications/:userId` | List user notifications |
| POST | `/api/notifications` | System: Send email/SMS/in-app notification |
| GET | `/api/notifications/log/:orderId` | View notification attempts for an order |

## Audit Logs
| Method | URL | Description |
|---|---|---|
| GET | `/api/audit-logs` | Admin: Search/filter audit logs |
| GET | `/api/audit-logs/:id` | View individual audit log |
| POST | `/api/audit-logs` | System: Append immutable audit log |

## Analytics & Reports
| Method | URL | Description |
|---|---|---|
| GET | `/api/analytics/dashboard` | Get aggregated business and operational metrics |
| GET | `/api/reports/export?type=&format=` | Admin: Export orders, inventory, or sales as CSV/PDF |