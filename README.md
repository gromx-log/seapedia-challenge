# SEAPEDIA Marketplace

SEAPEDIA is a multi-role e-commerce marketplace connecting Sellers, Buyers, and Drivers, built for the COMPFEST 18 SEA Academy challenge (Levels 1 to 4 build).

---

## Technical Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS (v4) + Lucide Icons
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL (running inside a local Docker container)
- **Auth**: JWT (httpOnly Lax Cookies) + `bcryptjs` password hashing
- **Validation**: `zod` schema validation (backend service gate)

---

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

Install dependencies and start the Next.js Turbopack development client:
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:3000` to interact with the web app.

---

## Core Specifications & Pricing Formula

### 1. Active Role Session Model
A user can hold multiple roles simultaneously (e.g. `BUYER` and `SELLER`).
- **Pre-Auth Picker**: On login, if a user has multiple roles, they receive a pre-auth token and are redirected to `/select-role` to select their active role.
- **Active Role Claim**: The session JWT cookie stores the `activeRole` claim. Authorization middleware verifies endpoints against this claim, ensuring a user only acts in their active capacity.
- **Direct Role Switching**: Multi-role users can switch active roles via the dropdown menu in the Navbar without logging out, swapping tokens on demand.

### 2. Single-Store Cart Rule
Shopping carts are locked to a single store at a time.
- Adding an item to an empty cart sets the cart's lock to that product's store.
- Adding items from the **same** store succeeds normally.
- Adding items from a **different** store is rejected with a `409 Conflict` error, prompting the buyer to clear their current cart first.
- Removing the last item from the cart clears the store lock.

### 3. Checkout Pricing & Calculations Order
Checkout pricing calculations must strictly follow this order:
1. **Subtotal**: Sum of (price × quantity) for all cart items.
2. **Discount**: Calculated based on the applied Voucher or Promo code against the subtotal (capped so it never exceeds the subtotal).
3. **Delivery Fee**: Added based on the selected method (flat rate, non-discountable, non-taxable):
   - `INSTANT`: Rp 15,000
   - `NEXT_DAY`: Rp 8,000
   - `REGULAR`: Rp 5,000
4. **PPN (12%)**: Calculated as `round(0.12 * (subtotal - discountAmount))`. Applies to the post-discount subtotal only.
5. **Total**: Calculated as `(subtotal - discountAmount) + deliveryFee + PPN`.

### 4. Database Transaction Safety
Checkout operations run in a single PostgreSQL database transaction. If any product stock is insufficient or the buyer's wallet balance is lower than the total price, the entire transaction rolls back, preventing partial writes.

---

## Seed Accounts / Demo Credentials

| Account | Username | Password | Role(s) | Notes |
|---|---|---|---|---|
| Admin | `admin` | `admin123` | ADMIN | Exclusive role, bypasses role picker |
| Seller | `seller1` | `seller123` | SELLER | Toko Seapedia Demo with preloaded products |
| Buyer | `buyer1` | `buyer123` | BUYER | Wallet loaded with `Rp 500.000` |

---

## API Endpoints Overview

| Method | Path | Active Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account |
| POST | `/api/auth/login` | None | Login credentials verification |
| POST | `/api/auth/select-role` | Pre-auth | Select active session role |
| POST | `/api/auth/switch-role` | Auth | Change active role on existing session |
| GET | `/api/auth/me` | Auth | Get current profile details |
| GET | `/api/reviews` | None | Get public feedback reviews |
| POST | `/api/reviews` | None | Submit feedback review |
| GET | `/api/products` | None | Browse public product catalog |
| GET | `/api/products/:id` | None | View product details |
| GET | `/api/stores/:id` | None | View store details |
| POST | `/api/seller/store` | SELLER | Create seller store |
| PATCH | `/api/seller/store` | SELLER | Update store details |
| GET | `/api/seller/products` | SELLER | List seller products |
| POST | `/api/seller/products` | SELLER | List new product |
| PATCH | `/api/seller/products/:id` | SELLER | Edit product details |
| DELETE | `/api/seller/products/:id` | SELLER | Remove/deactivate product |
| GET | `/api/seller/orders` | SELLER | Retrieve incoming store orders |
| PATCH | `/api/seller/orders/:id/process` | SELLER | Move order to awaiting courier pickup |
| GET | `/api/seller/reports/income` | SELLER | Retrieve store sales revenue report |
| GET | `/api/buyer/wallet` | BUYER | Check buyer wallet balance |
| POST | `/api/buyer/wallet/topup` | BUYER | Perform dummy topup |
| GET | `/api/buyer/wallet/transactions` | BUYER | List wallet transaction log |
| GET/POST/PATCH/DELETE | `/api/buyer/addresses` | BUYER | Manage shipping addresses CRUD |
| GET | `/api/buyer/cart` | BUYER | Fetch shopping cart details |
| POST | `/api/buyer/cart/items` | BUYER | Add product to cart |
| PATCH | `/api/buyer/cart/items/:id` | BUYER | Update item quantity |
| DELETE | `/api/buyer/cart/items/:id` | BUYER | Remove item from cart |
| DELETE | `/api/buyer/cart` | BUYER | Reset shopping cart |
| POST | `/api/buyer/discounts/validate` | BUYER | Verify promo/voucher code |
| POST | `/api/buyer/checkout` | BUYER | Checkout cart |
| GET | `/api/buyer/orders` | BUYER | Retrieve order history |
| GET | `/api/buyer/orders/:id` | BUYER | View detailed order timeline |
| GET | `/api/buyer/reports/spending` | BUYER | Retrieve spending expense report |
