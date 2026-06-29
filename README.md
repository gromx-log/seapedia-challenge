# SEAPEDIA Marketplace

SEAPEDIA is a multi-role e-commerce marketplace connecting Sellers, Buyers, and Drivers, built for the COMPFEST 18 SEA Academy challenge. This build targets **Level 1 through Level 7 (100/100 core points)**.

---

## Technical Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS (v4) + Lucide Icons
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL (running inside a local Docker container)
- **Auth**: JWT (httpOnly Lax Cookies) + `bcryptjs` password hashing
- **Validation**: `zod` schema validation (backend service gate)
- **Security**: `helmet` headers + `express-rate-limit` on login endpoint

---

## API Documentation

A full Postman collection is included in the repository root: **`SEAPEDIA_API.postman_collection.json`**

To use it:
1. Open Postman → Import → select `SEAPEDIA_API.postman_collection.json`
2. Set the collection variable `BASE_URL` to `http://localhost:4000` (default)
3. All authenticated requests use the session cookie — enable "Send cookies" in Postman settings

All endpoints, request bodies, and descriptions are documented in the collection.

## Getting Started

### 1. Database Setup (Docker)
Start the PostgreSQL container:
```bash
docker run --name seapedia-postgres -e POSTGRES_DB=seapedia -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

### 2. Backend Installation & Run
Configure environment variables inside `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/seapedia?schema=public"
JWT_SECRET="super_secret_seapedia_key_2026_challenge"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

Install dependencies, synchronize database tables, seed demo accounts, and start the development server:
```bash
cd backend
npm install
npx prisma db push
npm run db:seed
npm run dev
```

### 3. Frontend Installation & Run
Configure environment variables inside `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

Install dependencies and start the Next.js development client:
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:3000` to interact with the web app.

---

## Seed Accounts / Demo Credentials

| Account | Username  | Password    | Role(s) | Notes                                                         |
| ---------| -----------| -------------| ---------| ---------------------------------------------------------------|
| Admin   | `admin`   | `admin123`  | ADMIN   | Exclusive role, bypasses role picker                          |
| Seller  | `seller1` | `seller123` | SELLER  | Store: "Toko Seapedia Demo" with preloaded products           |
| Buyer   | `buyer1`  | `buyer123`  | BUYER   | Wallet pre-loaded with `Rp 500,000`                           |
| Driver  | `driver1` | `driver123` | DRIVER  | No pre-seeded jobs — appears once a Seller processes an order |

**Pre-seeded discount codes:**

| Code | Type | Kind | Value | Notes |
|---|---|---|---|---|
| `SEAPEDIA10` | Voucher | PERCENT | 10% | usageLimit: 100, expires +30 days |
| `WELCOME20K` | Promo | FLAT | Rp 20,000 | Expires +30 days |

---

## Core Business Rules

### 1. Active Role Session Model
A user can hold multiple roles simultaneously (e.g., `BUYER` and `SELLER`).
- **Pre-Auth Picker**: On login, if a user has multiple non-admin roles, they receive a short-lived pre-auth token and are redirected to `/select-role` to pick their active role.
- **Active Role Claim**: The session JWT cookie stores the `activeRole` claim. Authorization middleware verifies endpoints against this claim only — the backend never double-checks the full role list.
- **Role Switching**: Multi-role users can switch active roles via the Navbar dropdown without logging out.
- **Token Expiry**: Session JWTs expire after **48 hours** (documented, bounded, reasonable for a 2-day build/demo window).
- **Admin**: Admin accounts are exclusive — they hold only the `ADMIN` role, never combined with others, and never see the role picker.

### 2. Single-Store Cart Rule
Shopping carts are locked to a single store at a time:
- Adding an item to an empty cart sets the cart's store lock to that product's store.
- Adding items from the **same** store succeeds normally.
- Adding items from a **different** store is rejected with a `409 Conflict` error and a clear UI message: "Your cart is locked to Store X — clear cart to shop elsewhere."
- Removing the last item from the cart clears the store lock, allowing a new store to be selected.

### 3. Checkout Pricing & Calculation Order
Checkout pricing strictly follows this order:
1. **Subtotal**: Sum of (price × quantity) for all cart items.
2. **Discount**: Applied from the validated Voucher or Promo code against the subtotal (capped so it never exceeds the subtotal).
3. **Delivery Fee**: Added based on the selected method (flat rate, not discounted, not taxed):
   - `INSTANT`: Rp 15,000
   - `NEXT_DAY`: Rp 8,000
   - `REGULAR`: Rp 5,000
4. **PPN (12%)**: Calculated as `round(0.12 × (subtotal − discountAmount))`. Applies to the post-discount subtotal **only** — delivery fee is excluded from the tax base.
5. **Total**: `(subtotal − discountAmount) + deliveryFee + PPN`.

### 4. Discount Combination Rule
**Voucher and Promo cannot be combined.** A checkout request accepts a single `discountCode`. The backend looks up the code first in the Voucher table (which takes precedence if both exist), then in the Promo table.

- **Voucher**: requires `expiresAt > now` AND `usageCount < usageLimit`. On successful checkout, `usageCount` is incremented atomically.
- **Promo**: requires `expiresAt > now` only (no usage counter).

### 5. Order Status Lifecycle
The mandatory order statuses, in order:
1. `Sedang Dikemas` — set at checkout
2. `Menunggu Pengirim` — set when Seller processes the order
3. `Sedang Dikirim` — set when a Driver takes the delivery job
4. `Pesanan Selesai` — set when Driver confirms delivery complete
5. `Dikembalikan` — set by the overdue auto-return sweep

Every status transition creates a new `OrderStatusHistory` row with a timestamp.

### 6. Driver Earning Rule
Drivers earn a flat **80% of the order's delivery fee** per completed job. The earning amount is snapshotted into `DeliveryJob.earningAmount` at the moment of completion so that future fee-table changes never retroactively affect past earnings.

| Delivery Method | Order Fee | Driver Earning (80%) |
|---|---|---|
| INSTANT | Rp 15,000 | Rp 12,000 |
| NEXT_DAY | Rp 8,000 | Rp 6,400 |
| REGULAR | Rp 5,000 | Rp 4,000 |

### 7. Overdue SLA & Simulated Time
SLA windows are measured from `Order.createdAt` using the simulated clock:

| Delivery Method | SLA Window |
|---|---|
| INSTANT | 1 simulated day |
| NEXT_DAY | 2 simulated days |
| REGULAR | 4 simulated days |

An order is overdue if `simulatedNow − order.createdAt > SLA[method]` and status is not `PESANAN_SELESAI` or `DIKEMBALIKAN`.

**How to simulate time (demo):**
- Login as Admin → go to the "Simulate System Clock" tab → enter the number of days to advance → click "Advance Clock."
- This calls `POST /api/admin/system-clock/advance` which: (1) increments the `SystemClock.offsetMs` row, (2) immediately runs the overdue sweep, (3) returns the list of orders that were just auto-returned.
- All time comparisons across the app (`getNow()`) read from this simulated offset — no real cron job is needed.

**Overdue sweep actions (per eligible order, in one transaction):**
1. Set `Order.status = DIKEMBALIKAN` + new `OrderStatusHistory` row.
2. Refund full `order.total` to Buyer's wallet as a `REFUND` wallet transaction.
3. Restore product stock for each `OrderItem`.
4. Cancel the linked `DeliveryJob` (if exists and not already `COMPLETED`).
5. The sweep filters out orders already in `DIKEMBALIKAN`/`PESANAN_SELESAI` — **double-refund and double-restoration are structurally prevented.**

### 8. Seller/Driver Income Reports
Reports are computed dynamically by excluding orders with status `DIKEMBALIKAN` (and delivery jobs with status `CANCELLED`) at query time. This satisfies the "reversal or clearly adjusted report" requirement without a separate reversal-ledger table.

---

## Security Notes (Level 7)

### SQL Injection Prevention
Prisma's query builder is parameterized by construction — all user input is passed as query parameters, never string-concatenated into SQL. The app never uses `$queryRawUnsafe`. If raw SQL were ever needed, only `$queryRaw` with tagged-template parameters (safe) would be used.

### XSS Prevention
- Every free-text field users control (review comments, store/product names, descriptions, address fields, discount codes) passes through `sanitize.ts` on write — HTML-special characters (`<`, `>`, `&`, `"`, `'`, `/`) are entity-encoded before storage.
- React's default JSX text rendering is the second layer of defense (no `dangerouslySetInnerHTML` is used anywhere in the frontend).
- **Test case**: Paste `<script>alert(1)</script>` into the review comment field — it renders as plain text, not a popup.

### Input Validation
Every mutating endpoint has a `zod` schema checked before the controller touches the database:
- `email` — valid email format
- `phone` — non-empty string
- `rating` — integer 1–5
- `quantity` / `stock` / `price` — non-negative integers
- Discount `value` — 0–100 for `PERCENT`, positive int for `FLAT`
- Invalid input is rejected with `400` and a field-level error message.

### Session & RBAC Hardening
- **Logout** clears the cookie with the same `path` and `domain` it was issued with (preventing a classic "logout-but-cookie-remains" bug).
- **Protected endpoints** cannot be accessed by modifying frontend routes — the backend re-checks `requireAuth` + `requireRole(role)` on every request.
- **Resource ownership** is verified server-side for every mutating action: Sellers can only modify their own store/products, Buyers their own cart/orders/addresses, Drivers their own jobs only.
- **Admin endpoints** require `activeRole === 'ADMIN'` in the JWT — non-admin tokens are rejected with `403`.
- **SQL-meta string test**: Input `' OR 1=1 --` into login and search fields — Prisma treats it as a literal string, not a query fragment.

---

## API Endpoints Overview

### Auth
| Method | Path                    | Auth           | Description                                   |
| --------| -------------------------| ----------------| -----------------------------------------------|
| POST   | `/api/auth/register`    | None           | Create account with role(s)                   |
| POST   | `/api/auth/login`       | None           | Login; may return `requiresRoleSelection`     |
| POST   | `/api/auth/select-role` | Pre-auth token | Exchange for full JWT with chosen active role |
| POST   | `/api/auth/switch-role` | Auth           | Change active role in-session                 |
| POST   | `/api/auth/logout`      | Auth           | Clear session cookie                          |
| GET    | `/api/auth/me`          | Auth           | Current user profile + roles + active role    |

### Public
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/reviews` | None | List public application reviews |
| POST | `/api/reviews` | None | Submit a review (name, rating 1-5, comment) |
| GET | `/api/products` | None | Public catalog with store info |
| GET | `/api/products/:id` | None | Public product detail |
| GET | `/api/stores/:id` | None | Public store detail |

### Seller
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/seller/store` | SELLER | Create store (unique name enforced) |
| PATCH | `/api/seller/store` | SELLER | Update own store |
| GET | `/api/seller/products` | SELLER | List own products |
| POST | `/api/seller/products` | SELLER | Create product under own store |
| PATCH | `/api/seller/products/:id` | SELLER | Update own product |
| DELETE | `/api/seller/products/:id` | SELLER | Delete/deactivate own product |
| GET | `/api/seller/orders` | SELLER | Incoming orders for own store |
| PATCH | `/api/seller/orders/:id/process` | SELLER | Move order: `SEDANG_DIKEMAS` → `MENUNGGU_PENGIRIM` |
| GET | `/api/seller/reports/income` | SELLER | Seller income/revenue summary |

### Buyer
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/buyer/wallet` | BUYER | Balance + summary |
| POST | `/api/buyer/wallet/topup` | BUYER | Dummy top-up |
| GET | `/api/buyer/wallet/transactions` | BUYER | Transaction history |
| GET | `/api/buyer/addresses` | BUYER | List addresses |
| POST | `/api/buyer/addresses` | BUYER | Create address |
| PATCH | `/api/buyer/addresses/:id` | BUYER | Update address |
| DELETE | `/api/buyer/addresses/:id` | BUYER | Delete address |
| GET | `/api/buyer/cart` | BUYER | Cart summary |
| POST | `/api/buyer/cart/items` | BUYER | Add item (single-store rule enforced) |
| PATCH | `/api/buyer/cart/items/:id` | BUYER | Update quantity |
| DELETE | `/api/buyer/cart/items/:id` | BUYER | Remove item |
| DELETE | `/api/buyer/cart` | BUYER | Clear cart |
| POST | `/api/buyer/discounts/validate` | BUYER | Preview discount effect |
| POST | `/api/buyer/checkout` | BUYER | Create order (full pricing + stock + wallet logic) |
| GET | `/api/buyer/orders` | BUYER | Order history |
| GET | `/api/buyer/orders/:id` | BUYER | Order detail + status timeline + delivery info |
| GET | `/api/buyer/reports/spending` | BUYER | Spending summary |

### Driver
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/driver/jobs` | DRIVER | Available delivery jobs (`status = AVAILABLE`) |
| GET | `/api/driver/jobs/history` | DRIVER | Own jobs (all statuses) |
| GET | `/api/driver/jobs/earnings` | DRIVER | Earnings summary (completed jobs) |
| GET | `/api/driver/jobs/:id` | DRIVER | Job detail |
| POST | `/api/driver/jobs/:id/take` | DRIVER | Atomic take; `409` if already taken |
| POST | `/api/driver/jobs/:id/complete` | DRIVER | Owning driver only; sets Order → `PESANAN_SELESAI` |

### Admin — Discounts
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/vouchers` | ADMIN | Generate voucher |
| GET | `/api/admin/vouchers` | ADMIN | List all vouchers |
| GET | `/api/admin/vouchers/:id` | ADMIN | Voucher detail |
| DELETE | `/api/admin/vouchers/:id` | ADMIN | Delete voucher |
| POST | `/api/admin/promos` | ADMIN | Generate promo |
| GET | `/api/admin/promos` | ADMIN | List all promos |
| GET | `/api/admin/promos/:id` | ADMIN | Promo detail |
| DELETE | `/api/admin/promos/:id` | ADMIN | Delete promo |

### Admin — Monitoring
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/monitoring/users` | ADMIN | All users + roles |
| GET | `/api/admin/monitoring/stores` | ADMIN | All stores |
| GET | `/api/admin/monitoring/products` | ADMIN | All products |
| GET | `/api/admin/monitoring/orders` | ADMIN | All orders, any status |
| GET | `/api/admin/monitoring/delivery-jobs` | ADMIN | All delivery jobs, any status |
| GET | `/api/admin/monitoring/overdue-orders` | ADMIN | Orders past SLA + `DIKEMBALIKAN` history |

### Admin — System Clock
| Method | Path                              | Auth  | Description                                |
| --------| -----------------------------------| -------| --------------------------------------------|
| GET    | `/api/admin/system-clock`         | ADMIN | Current simulated time                     |
| POST   | `/api/admin/system-clock/advance` | ADMIN | Advance simulated time + run overdue sweep |

---

## End-to-End Demo Guide

Full flow to rehearse before submission (covers all 7 levels):

1. **Guest**: Browse catalog and product details without logging in.
2. **Register**: Create a new buyer account at `/register`.
3. **Login + Role Select**: Login with the new buyer account; if multi-role, select BUYER at `/select-role`.
4. **Buyer top-up**: Dashboard → Wallet → Top Up.
5. **Add to cart**: Browse catalog → add a product from `seller1`'s store.
6. **Single-store test**: Try adding a product from a different store (confirm rejection message).
7. **Checkout**: Apply voucher `SEAPEDIA10`, select delivery method, confirm checkout summary shows subtotal / discount / delivery fee / PPN 12% / total.
8. **View order**: See order in `Sedang Dikemas` status with timestamp.
9. **Seller processes order**: Login as `seller1` → Dashboard → Orders → process the order → status moves to `Menunggu Pengirim`.
10. **Driver takes job**: Login as `driver1` → Dashboard → Available Jobs → Accept → status moves to `Sedang Dikirim`.
11. **Driver completes delivery**: Active Delivery tab → Complete Delivery → status moves to `Pesanan Selesai`.
12. **Verify tracking**: Buyer/Seller order detail shows full status timeline with timestamps and driver info.
13. **Driver earnings**: Driver dashboard → Earnings tab → shows completed job count and total earnings.
14. **Reports**: Buyer spending report and Seller income report both reflect the completed order.
15. **Overdue demo**: Place a second order, do not process it. Login as Admin → Simulate System Clock → advance 5 days. Confirm the unprocessed order flips to `Dikembalikan`, buyer wallet is refunded, stock is restored, and the history shows the auto-return note.
16. **Admin monitoring**: Verify users / stores / products / orders / delivery jobs / overdue history all show correct data.
17. **Admin discounts**: Generate a new voucher from the Admin UI; verify it appears in the list.
18. **XSS test**: Submit a review with `<script>alert(1)</script>` as the comment → renders as safe text.
19. **SQL injection test**: Enter `' OR 1=1 --` into the login password field → login fails with an error, database is unaffected.
