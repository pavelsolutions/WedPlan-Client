# WedPlan — Wedding Planning Platform
## Complete Development Plan (Beginner-Friendly)

> Based on: **Assignment 9 — Category 004** requirement document.
> Goal: a complete, role-based wedding planning web application — not just static pages.

---

## 1. What is WedPlan? (Simple Explanation)

WedPlan is like an **online marketplace for wedding services**.

Think of it this way:

- People getting married (**Customers**) need photographers, venues, caterers, decorators, etc.
- Businesses that provide those services (**Vendors**) want customers to find them.
- **WedPlan** connects the two sides in one website:

```
Customer: "I need a photographer for my wedding on 20-Dec-2026"
        ↓ (sends a booking request)
Vendor:  "I am a photographer, I accept your booking"
Admin:   "I check that every service published on the site is real and appropriate"
```

So WedPlan has **three sides**:
1. A public "shop window" anyone can browse (Home, Browse Services, Service Details).
2. Private dashboards (one per role) where the real work happens.
3. A payment system (Stripe) so Vendors can upgrade to **Premium** and publish unlimited services.

**Tech stack (required by the assignment):**

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + ShadCN UI + Framer Motion |
| Backend | Express.js (Node.js) |
| Database | MongoDB (via Mongoose) |
| Authentication | Better Auth (+ Google OAuth) |
| Payments | Stripe Checkout (Test Mode) + Stripe Webhooks |
| Image hosting | ImgBB (images uploaded as files, not URLs) |
| Deployment | Client → Vercel, Server → Vercel/Render, DB → MongoDB Atlas |

**Two separate repositories (required):**
- `wedplan-client` → the Next.js frontend (this folder)
- `wedplan-server` → the Express.js backend

---

## 2. The Three User Roles

### 👰 Customer (the person getting married)
- Registers as a **Customer** (email/password or Google).
- Browses and searches wedding services **without logging in**.
- Must **log in** to view full service details and to book.
- Sends **booking requests** (event date, event location, message) to a vendor.
- Tracks booking status: **Pending → Accepted / Rejected**, and can **cancel** a pending booking.
- Has a **Customer Dashboard** with stats and "My Bookings".

### 🤵 Vendor (the service provider, e.g., photographer)
- Registers as a **Vendor** (email/password or Google).
- Creates a vendor profile (business name).
- **Adds wedding services** (name, category, description, price, location, image uploaded via ImgBB).
- New services start as **Pending** until an **Admin approves** them.
- **Free plan**: maximum **3 active services**. **Premium plan (Stripe)**: unlimited services + Premium badge.
- Sees **booking requests** for their services and can **Accept or Reject** them (only while pending; one decision is final).
- Has a **Vendor Dashboard**: overview stats, My Services, Add Service, Booking Requests, Subscription, Profile.

### 🛡️ Admin (platform operator)
- Admin accounts are **NOT created from the public sign-up form** — they are created securely (e.g., seeded in the database with a strong password, credentials submitted for evaluation).
- **Manages users**: search, filter by role, view details, **Block / Unblock**.
- **Manages services**: reviews pending services, **Approve / Reject**, can change status of published services, can delete inappropriate services.
- **Views transactions**: all Stripe subscription payments (read-only — admin cannot fake a payment as successful).
- Has an **Admin Dashboard** with platform-wide stats.

### Security rule (very important)
Every dashboard is protected in **two places**:
1. **Frontend**: route guard redirects unauthenticated users to Sign In; role guard blocks wrong roles.
2. **Server**: every protected API checks the **JWT token** and the **user's role**. Hiding buttons/links in the UI is never enough. A customer manually typing `/dashboard/admin` in the URL must get blocked — and even if they got the page, the API would return **403 Forbidden**.

---

## 3. Complete Project Workflow (How the App Works End-to-End)

### Workflow A — Visitor discovers services
```
Home page (banner, featured services, categories, animations)
   → Browse Services page (search by name, filter by category & location, sort by price)
   → clicks "View Details"
   → NOT logged in? → redirected to Sign In page
   → logged in? → Service Details page (/services/[id])
```

### Workflow B — Customer books a service
```
Customer on Service Details page
   → clicks "Book This Service"
   → Booking form opens: Event Date, Event Location, Additional Message
   → Server automatically attaches: customerId (from JWT), vendorId (from the service)
   → Saved in `bookings` collection with status = "Pending"
   → Duplicate check: same customer + same service + same event date + active status → rejected with error message
   → Vendor cannot book their own service; Admin cannot book at all
   → Success toast shown
```

### Workflow C — Vendor manages the booking
```
Vendor Dashboard → Booking Requests
   → sees: customer info, service info, event date, event location, message, status
   → clicks Accept or Reject (only possible while status = Pending)
   → status becomes Accepted or Rejected — cannot be changed again
```

### Workflow D — Customer tracks & cancels
```
Customer Dashboard → My Bookings
   → sees all requests with status and booking date
   → can Cancel only PENDING bookings (accepted/rejected/cancelled cannot change)
   → can only cancel their OWN bookings (server verifies ownership)
```

### Workflow E — Vendor publishes a service
```
Vendor Dashboard → Add Service
   → fills form, uploads image file → ImgBB → image URL stored
   → saved in `services` collection with status = "Pending"
   → Admin Dashboard → Manage Services → Approve
   → service now appears on Home (featured) + Browse Services (public)
   → Free plan limit check: max 3 ACTIVE services; Premium = unlimited
   → Vendor can update, delete, or toggle availability of their own services
   → Rejected services are invisible to customers
```

### Workflow F — Vendor upgrades to Premium (Stripe)
```
Vendor Dashboard → Subscription → "Upgrade to Premium"
   → Server (keeps secret key) creates a Stripe Checkout Session
   → Vendor is redirected to Stripe's hosted payment page
   → Success → Payment Success page    |   Cancel → Payment Cancel page
   ⚠ IMPORTANT: the success page does NOT activate Premium by itself.
     Stripe sends a WEBHOOK event to the server → server verifies it with the
     webhook secret → saves a `transactions` record → sets user's
     subscriptionPlan = "premium" and subscriptionExpiresAt
   → Premium badge appears; service limit lifted
   → Handle cancellation/expiration: when subscriptionExpiresAt passes,
     vendor reverts to Free rules
```

### Workflow G — Admin moderates the platform
```
Admin Dashboard → Overview (totals: users, vendors, customers, services, pending services, transactions)
   → Manage Users (search name/email, filter role, view, Block/Unblock)
   → Manage Services (review pending, approve/reject, change status, delete)
   → Transactions (vendor, plan, amount, status, date — read-only)
Blocked users cannot access any protected feature (checked on server too).
```

---

## 4. All Required Pages & Features

### 4.1 Layout components (every page)
| Component | Requirements |
|---|---|
| **Navbar** | Logo "WedPlan". Public: Home, Browse Services, Sign In, Sign Up. Logged in: Home, Browse Services, **profile dropdown** (avatar + name → Dashboard, Profile Settings, Logout). Navbar must update **immediately** when auth state changes. |
| **Footer** | Logo + short description, important navigation links, contact info, social media links, copyright. |
| **Dashboard layout** | Separate layout: **sidebar** (role-based links, logo, user info, logout) + **main content area**. Responsive, consistent theme, stat cards. |

### 4.2 Public pages
| Page | Route | Features |
|---|---|---|
| **Home** | `/` | Banner (title, short description, CTA "Explore Wedding Services", wedding-themed background image) • **Featured Wedding Services** (≥6, only approved+active, card: image, name, category, price, location, vendor info, View Details) • **Wedding Service Categories** (Photography & Videography, Wedding Venues, Decoration & Florist, Catering Services, Makeup & Styling, Wedding Fashion — clickable → filtered browse) • **Why Choose WedPlan?** • one of: How WedPlan Works / Popular Wedding Destinations / Customer Testimonials / Wedding Planning Tips • **Framer Motion animations** on suitable sections (smooth, not distracting) |
| **Browse Services** | `/services` | Card grid of approved+active services • **Search by name** • **Filter by category** • **Filter by location** • **Sort by price (asc & desc)** (challenge requirement) • **Loading state** (skeleton/spinner) • **Empty state** ("no services found") • View Details when not logged in → redirect to Sign In |
| **Service Details** | `/services/[id]` | **Private** (redirect to Sign In if not logged in) • Name, **multiple images**, category, description, price, location, vendor info • Booking option • Rules: vendor can't book own service, admin can't book, invalid ID → friendly error, only approved+active services bookable |
| **Sign Up** | `/signup` | Full Name, Email, Password, Profile Image (optional, **file upload → ImgBB**), **Role selector (Vendor / Customer)** • Password rules: min 6 chars, ≥1 uppercase, ≥1 lowercase • Google sign-up • success/error messages • redirect after registration • **No admin creation here** |
| **Sign In** | `/signin` | Email + Password • Google login • success/error messages • **redirect by role** (customer/vendor → dashboard, etc.) |

### 4.3 Payment pages
| Page | Route | Features |
|---|---|---|
| **Payment Success** | `/payment/success` | Confirmation UI; actual activation is done **only by the verified Stripe webhook** |
| **Payment Cancel** | `/payment/cancel` | Friendly "payment was cancelled" message + retry option |

### 4.4 Vendor Dashboard (`/dashboard/vendor/...`)
| Page | Features |
|---|---|
| **Overview** | Stats: Total Services, Active Services, Pending Booking Requests, Accepted Bookings, Current Subscription Plan |
| **My Services** | Table/cards of the vendor's own services with info, **approval status**, edit, delete, availability toggle. Rejected services invisible to customers. Plan usage indicator (e.g., 2/3 active). |
| **Add Service** | Form: Service Name, Category, Description, Price, Location, Image (**file upload → ImgBB**). Validation on all required fields. Saved with status **Pending**. Free plan: max 3 active services (button/API blocks the 4th). |
| **Booking Requests** | Requests for this vendor's services only: customer info, service info, event date, event location, message, status. **Accept / Reject** (pending only, one-time decision). |
| **Subscription** | Plan cards: **Free** (max 3 active services, basic dashboard, booking management) vs **Premium** (unlimited services, premium badge, all free features). "Upgrade to Premium" → Stripe Checkout. Payment history. |
| **Profile Settings** | Update name, profile image, etc. Cannot change own role or subscription. |

### 4.5 Customer Dashboard (`/dashboard/customer/...`)
| Page | Features |
|---|---|
| **Overview** | Stats: Total Booking Requests, Pending, Accepted, Rejected |
| **My Bookings** | All own bookings: service name + image, vendor info, event date, event location, status, request date. View details, **Cancel pending bookings only**, ownership enforced on server. |
| **Profile Settings** | Same shared profile page as vendors. |

### 4.6 Admin Dashboard (`/dashboard/admin/...`)
| Page | Features |
|---|---|
| **Overview** | Stats: Total Users, Total Vendors, Total Customers, Total Services, Pending Services, Total Transactions |
| **Manage Users** | Search by name/email, filter by role, view details, **Block / Unblock**. Blocked users lose access to protected features. |
| **Manage Services** | All services, search & filter, review **Pending** ones, **Approve / Reject**, change status of published services when necessary, delete inappropriate ones. |
| **Transactions** | Vendor info, plan, amount, payment status, transaction date. **Read-only** (admin cannot mark failed payments as successful). |

### 4.7 Cross-cutting requirements (apply everywhere)
- **Loading states**: while fetching services, dashboard data, submitting forms, processing bookings, processing payments.
- **Error handling**: invalid routes (404 page), failed API requests, invalid form submissions, unauthorized access (401/403 pages or redirects), missing DB records, failed image uploads.
- **Toast notifications** for all success/error feedback — **never `alert()`**.
- **Fully responsive**: desktop, tablet, mobile.
- **Professional wedding-themed UI**: consistent spacing, typography, colors; ShadCN components; reusable components; no visual clutter; all buttons/links must work.
- **No reload issues**: refreshing any route on production must not 404 (Next.js handles this; server CORS must be correct).

---

## 5. MongoDB Database Structure

> Total: **4 collections only**. Better Auth creates/manages its own auth collections
> (e.g., `user`, `session`, `account`, `verification`) — we **extend the Better Auth
> `user` collection** with extra business fields instead of making a second users
> collection. Do **not** create unnecessary duplicate collections.

### 5.1 `user` (managed by Better Auth + our extra fields)
```js
{
  _id: ObjectId,
  name: String,                       // Better Auth
  email: String (unique),             // Better Auth
  emailVerified: Boolean,             // Better Auth
  image: String,                      // Better Auth (ImgBB URL)
  createdAt: Date,                    // Better Auth
  updatedAt: Date,                    // Better Auth
  // ---- our custom fields ----
  role: "customer" | "vendor" | "admin",   // default "customer" at signup
  isBlocked: Boolean,                      // default false (admin control)
  businessName: String,                    // vendors only (optional vendor profile)
  subscriptionPlan: "free" | "premium",    // vendors only, default "free"
  subscriptionExpiresAt: Date | null       // premium expiry; null = never/free
}
```

### 5.2 `services`
```js
{
  _id: ObjectId,
  vendorId: ObjectId → user._id,      // who owns the service
  serviceName: String,
  category: String,                   // one of the 6 categories
  description: String,
  price: Number,
  location: String,
  images: [String],                   // ImgBB URLs (supports multiple)
  status: "pending" | "approved" | "rejected",   // admin controls approval
  isActive: Boolean,                  // vendor availability toggle
  createdAt: Date
}
// Public pages show ONLY: status === "approved" && isActive === true
```

### 5.3 `bookings`
```js
{
  _id: ObjectId,
  serviceId: ObjectId → service._id,  // which service
  vendorId: ObjectId → user._id,      // copied from the service (fast queries)
  customerId: ObjectId → user._id,    // who booked (from JWT, never from body)
  eventDate: Date,
  eventLocation: String,
  message: String,                    // additional message (optional)
  status: "pending" | "accepted" | "rejected" | "cancelled",
  createdAt: Date
}
```

### 5.4 `transactions`
```js
{
  _id: ObjectId,
  vendorId: ObjectId → user._id,      // who paid
  plan: "premium",
  amount: Number,
  currency: String,                   // e.g., "usd"
  stripeSessionId: String,            // Checkout Session id
  stripeSubscriptionId: String | null,
  status: "paid" | "failed" | "refunded",   // set ONLY from verified webhook data
  createdAt: Date
}
```

### Indexes (for performance)
- `user.email` (unique), `user.role`
- `services.vendorId`, `services.status`, `services.category`, `services.location`, text index on `serviceName`
- `bookings.customerId`, `bookings.vendorId`, `bookings.serviceId`, compound `(customerId, serviceId, eventDate, status)` for the duplicate-booking check

---

## 6. Relationships Between Users, Services, Bookings & Transactions

```
user (vendor)  ──1:N──▶  services        "A vendor owns many services"
user (vendor)  ──1:N──▶  bookings        "A vendor receives many bookings"
user (customer) ─1:N──▶  bookings        "A customer makes many bookings"
service        ──1:N──▶  bookings        "One service can be booked many times"
user (vendor)  ──1:N──▶  transactions    "A vendor pays many times (renewals)"
```

**In MongoDB we don't have real foreign keys — we store ObjectId references and "join" manually:**

- `services.vendorId` → tells us who owns a service. When showing a service card, we fetch the vendor's `name`, `image`, `businessName`.
- `bookings` stores **three references** (`serviceId`, `vendorId`, `customerId`) — a classic "linking table". `vendorId` is copied (denormalized) from the service so we can find "all bookings for MY services" with one query.
- `transactions.vendorId` → links a payment to the vendor who paid.
- **Ownership checks** everywhere use these references:
  - Vendor updates a service? → `service.vendorId === token.userId` else **403**.
  - Customer cancels a booking? → `booking.customerId === token.userId` else **403**.
  - Vendor accepts a booking? → `booking.vendorId === token.userId` else **403**.

**Status flows:**
```
Service:   pending → approved → (active/inactive toggle)      pending → rejected
Booking:   pending → accepted | rejected | cancelled (customer cancels while pending)
```

---

## 7. Frontend & Backend Architecture

### 7.1 Big picture
```
┌─────────────────────────┐         HTTPS/JSON          ┌──────────────────────────┐
│  CLIENT (wedplan-client) │  ◀──────────────────────▶  │  SERVER (wedplan-server)  │
│  Next.js App Router      │   JWT in Authorization     │  Express.js               │
│  - Public pages (SSR)    │   header on protected      │  - Better Auth (/api/auth)│
│  - Dashboards (guarded)  │   API calls                │  - JWT verify middleware  │
│  - ShadCN UI + Tailwind  │                            │  - Role middleware        │
│  - Framer Motion         │                            │  - Mongoose → MongoDB     │
└─────────────────────────┘                            └────────────┬─────────────┘
        │            │                                               │
     ImgBB        Stripe.js                                     Stripe Webhook
  (image upload)  (redirect to                       (verifies payment, activates
                   Checkout page)                        Premium — never the frontend)
```

### 7.2 Frontend architecture (Next.js App Router)
```
src/
├─ app/
│  ├─ page.tsx                    # Home
│  ├─ services/
│  │  ├─ page.tsx                 # Browse Services
│  │  └─ [id]/page.tsx            # Service Details (private)
│  ├─ (auth)/
│  │  ├─ signin/page.tsx
│  │  └─ signup/page.tsx
│  ├─ payment/
│  │  ├─ success/page.tsx
│  │  └─ cancel/page.tsx
│  ├─ dashboard/                  # layout with sidebar (role-aware)
│  │  ├─ page.tsx                 # redirects to the right role overview
│  │  ├─ vendor/{overview,my-services,add-service,booking-requests,subscription}/
│  │  ├─ customer/{overview,my-bookings}/
│  │  ├─ admin/{overview,manage-users,manage-services,transactions}/
│  │  └─ profile/page.tsx         # shared Profile Settings
│  └─ not-found.tsx               # 404 page
├─ components/
│  ├─ ui/                         # ShadCN components
│  ├─ layout/ (Navbar, Footer, DashboardSidebar, ProfileDropdown)
│  ├─ services/ (ServiceCard, ServiceFilters, BookingForm)
│  ├─ dashboard/ (StatCard, DataTable, StatusBadge)
│  └─ shared/ (Loader, EmptyState, ConfirmDialog)
├─ lib/ (apiClient with JWT header, auth client for Better Auth, imgbb upload, utils)
├─ hooks/ (useSession, useServices, useBookings…)
└─ types/ (TypeScript interfaces for Service, Booking, User, Transaction)
```

**Key frontend behaviors:**
- Auth state via Better Auth's client (`authClient`); navbar + guards react instantly.
- Route guards: middleware or layout-level checks → unauthenticated → `/signin`; wrong role → "not allowed" page.
- All API calls to Express go through one `apiClient` that attaches the JWT and shows toasts on errors.
- Data fetching with loading/error/empty states on every screen.

### 7.3 Backend architecture (Express.js)
```
wedplan-server/src/
├─ index.js                 # app + CORS + JSON + routes + error handler
├─ config/ (env, mongodb, stripe)
├─ lib/ (auth.ts)           # Better Auth instance mounted at /api/auth
├─ middleware/
│  ├─ verifyJWT.ts          # verifies Bearer token → 401 if invalid/expired
│  ├─ verifyRole.ts         # requireRole("admin") etc. → 403 if wrong role
│  └─ verifyStripeWebhook.ts# verifies Stripe signature (raw body)
├─ routes/ (services, bookings, payments, admin, users, featured)
├─ controllers/             # one controller per route group
├─ models/ (Service, Booking, Transaction)  # user model = Better Auth's
└─ utils/ (imgbb upload, plan limit checker, apiError/apiResponse helpers)
```

**Request pipeline (example: vendor creates a service):**
```
POST /api/services
  → verifyJWT          (valid token? → 401 if not)
  → verifyRole("vendor")   (vendor? → 403 if customer/admin)
  → validate body      (all fields present, price is a number…)
  → plan check         (free vendor already has 3 active services? → 403 "upgrade to Premium")
  → create document    (vendorId from JWT, status "pending")
  → 201 Created response
```

**Security rules baked into the server:**
- Never trust `userId` or `role` from the request body — always from the verified JWT.
- Resource ownership verified before any update/delete (403 otherwise).
- Stripe secret key + webhook secret only on the server, in `.env`.
- Premium activation **only** from verified webhook events, never from the frontend success redirect.
- Proper HTTP codes: **401** unauthorized, **403** forbidden, **400** bad request, **404** missing record.

---

## 8. Required API Endpoints

> Base URL: `https://your-server/api` — Better Auth provides its own routes under `/api/auth/*`
> (sign-up, sign-in, Google OAuth, session). All protected routes require
> `Authorization: Bearer <JWT>`.

### 8.1 Public (no token)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/services` | List approved+active services. Query: `search` (name), `category`, `location`, `sort=price_asc\|price_desc`, `page`, `limit` |
| GET | `/api/services/featured` | Featured services for Home (≥6) |
| GET | `/api/services/:id` | Single service details (404 if invalid ID / not approved-inactive handling) |
| GET | `/api/users/profile` | Current logged-in user's profile (any role, requires token) |

### 8.2 Auth (Better Auth)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Register (customer/vendor) with role |
| POST | `/api/auth/sign-in/email` | Login |
| GET | `/api/auth/sign-in/social` | Google OAuth |
| POST | `/api/auth/sign-out` | Logout |
| GET | `/api/auth/get-session` | Session info (also used to get the JWT) |

### 8.3 Customer (token + role: customer)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/bookings` | Create booking request (duplicate + self-booking checks; status: pending) |
| GET | `/api/bookings/my` | My bookings (customer) |
| GET | `/api/bookings/stats` | Customer dashboard stats (total, pending, accepted, rejected) |
| PATCH | `/api/bookings/:id/cancel` | Cancel own **pending** booking only |

### 8.4 Vendor (token + role: vendor)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/vendors/me/dashboard-stats` | Total/active services, pending requests, accepted bookings, current plan |
| POST | `/api/services` | Create service (**plan limit enforced**, status: pending) |
| GET | `/api/services/vendor/me` | My services (all statuses) |
| PATCH | `/api/services/:id` | Update own service (ownership check) |
| DELETE | `/api/services/:id` | Delete own service (ownership check) |
| PATCH | `/api/services/:id/availability` | Toggle `isActive` |
| GET | `/api/bookings/vendor` | Booking requests for my services |
| PATCH | `/api/bookings/:id/accept` | Accept own pending booking (one-time) |
| PATCH | `/api/bookings/:id/reject` | Reject own pending booking (one-time) |

### 8.5 Payments / Subscription (token + role: vendor)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/payments/create-checkout-session` | Create Stripe Checkout Session for Premium (session created for the **token's** vendor only) |
| POST | `/api/payments/webhook` | Stripe webhook (raw body + signature verify) → save transaction → activate Premium |
| GET | `/api/payments/my` | Vendor's payment history |

### 8.6 Admin (token + role: admin)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/stats` | Platform overview stats |
| GET | `/api/admin/users` | All users. Query: `search` (name/email), `role`, `page` |
| GET | `/api/admin/users/:id` | User details |
| PATCH | `/api/admin/users/:id/block` | Block user |
| PATCH | `/api/admin/users/:id/unblock` | Unblock user |
| GET | `/api/admin/services` | ALL services (any status). Query: `search`, `status`, `category` |
| PATCH | `/api/admin/services/:id/approve` | Approve pending service |
| PATCH | `/api/admin/services/:id/reject` | Reject service |
| PATCH | `/api/admin/services/:id/status` | Change status of a published service |
| DELETE | `/api/admin/services/:id` | Delete inappropriate service |
| GET | `/api/admin/transactions` | All transactions (read-only) |

### 8.7 Profile (any authenticated role)
| Method | Endpoint | Purpose |
|---|---|---|
| PATCH | `/api/users/profile` | Update name, image, other editable info (**role/subscription ignored server-side**) |

---

## 9. Step-by-Step Development Roadmap

> ⚠️ **Note about the Next.js version in this project:** `AGENTS.md` in `wedplan-client`
> says this Next.js version has breaking changes. **Before writing any code, read the
> relevant guides in `node_modules/next/dist/docs/`** (App Router, data fetching,
> middleware) so we don't use outdated patterns.

### Phase 0 — Setup & Planning (today)
1. Read the Next.js docs shipped in `node_modules/next/dist/docs/`.
2. Create GitHub repos: `wedplan-client` + `wedplan-server` (separate repos — required).
3. Set up `.env` files (git-ignored) for both: MongoDB URI, Better Auth secret, Google OAuth client ID/secret, Stripe secret + webhook secret, ImgBB API key, app URLs.
4. Seed plan: decide how the Admin account is created securely (DB seed script, not public signup).

### Phase 1 — Server foundation (server commits start here)
5. Express + Mongoose setup, MongoDB Atlas connection, CORS (allow the deployed client origin), global error handler with proper status codes.
6. Integrate **Better Auth** (email/password + Google OAuth), extend the user model with `role, isBlocked, businessName, subscriptionPlan, subscriptionExpiresAt`.
7. `verifyJWT` middleware + `requireRole("admin" | "vendor" | "customer")` middleware.
8. Test auth + middleware with Postman/Thunder Client. ✅ *Server ~4 commits*

### Phase 2 — Services APIs
9. Service model + public endpoints: list (search/filter/sort/pagination), featured, details.
10. Vendor CRUD: create (with Free plan 3-active-services limit), my services, update, delete, availability toggle — all with ownership checks.
11. Admin endpoints: list all, approve, reject, change status, delete.
12. ImgBB upload utility (server receives the file, uploads to ImgBB, stores URL). ✅ *Server ~4 commits*

### Phase 3 — Bookings APIs
13. Booking model + create (duplicate check, self-booking block, admin block).
14. Customer: my bookings, stats, cancel pending.
15. Vendor: booking requests list, accept, reject (one-time rule). ✅ *Server ~3 commits*

### Phase 4 — Stripe
16. `/create-checkout-session` (server keeps secret key; session tied to token's vendor).
17. Webhook endpoint with signature verification → save `transactions` doc → set `subscriptionPlan=premium` + `subscriptionExpiresAt`.
18. Expiration logic: expired premium → back to Free limits. ✅ *Server ~2 commits (≥12 total)*

### Phase 5 — Client foundation
19. ShadCN init, wedding theme (colors/typography), Navbar + Footer, reusable components, toast setup, `apiClient` with JWT.
20. Sign Up (role selector, ImgBB profile image, password rules) + Sign In + Google auth + role-based redirect. Navbar updates instantly on auth change. ✅ *Client ~5 commits*

### Phase 6 — Public pages
21. Home: banner, Featured Services (dynamic from API), Categories grid, Why Choose WedPlan, extra section, Framer Motion animations.
22. Browse Services: search, category + location filters, price sort, loading/empty states.
23. Service Details: private route (redirect to signin), gallery, vendor info, invalid-ID error page, booking rules enforced. ✅ *Client ~5 commits*

### Phase 7 — Dashboards
24. Dashboard layout: responsive sidebar with role-based links + role guard on all routes.
25. Vendor: Overview stats, Add Service (ImgBB + validation + plan limit), My Services (edit/delete/toggle/status), Booking Requests (accept/reject), Subscription (plans + Stripe redirect).
26. Customer: Overview stats, My Bookings (view/cancel).
27. Admin: Overview, Manage Users (search/filter/block/unblock), Manage Services (review/approve/reject/delete), Transactions (read-only).
28. Shared Profile Settings page (role/subscription fields not editable). ✅ *Client ~6 commits*

### Phase 8 — Payments UI
29. Payment Success + Cancel pages (UI only; activation via webhook).
30. Test the full Stripe flow with test card `4242 4242 4242 4242` + webhook (use Stripe CLI locally). ✅ *Client ~2 commits (≥20 total)*

### Phase 9 — Polish
31. 404 page, error boundaries, all loading skeletons, toasts everywhere.
32. Full responsiveness pass (desktop/tablet/mobile).
33. Framer Motion polish, accessibility, all links/buttons verified.

### Phase 10 — Deployment (do this EARLY, not last minute)
34. MongoDB Atlas (allow server IPs) → deploy server (Vercel/Render) → set env vars on the host.
35. Deploy client to Vercel; set `NEXT_PUBLIC_API_URL` and OAuth redirect URLs; configure Stripe webhook URL to the live server.
36. Verify the deployment checklist:
    - No CORS / 404 / 504 issues
    - Route refresh works; private routes work after refresh; users stay logged in
    - Stripe Checkout + webhook work live
    - Admin credentials (submitted for evaluation) work live
    - Role-based URL access blocked (customer can't open admin pages)

### Phase 11 — Final testing & submission
37. Test all features from all 3 roles end-to-end (especially bookings from both sides).
38. Verify commit counts (≥20 client, ≥12 server, all meaningful).
39. Write **README.md** in both repos: name/description, features, tech stack, installation, run locally, live link, repo links, environment variables list.
40. Submit: Admin Email + Password, Live Site Link, Server repo, Client repo, testing instructions.

---

## 10. Environment Variables Checklist (never commit these!)

**Server `.env`:**
```
MONGODB_URI=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
IMGBB_API_KEY=
JWT_SECRET=
CLIENT_URL=
PORT=
```

**Client `.env`:**
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_IMGBB_API_KEY=     # (upload can also go through the server)
GOOGLE_CLIENT_ID=              # if Google button runs client-side
```

---

## 11. Assignment Compliance Checklist
- [ ] ≥20 meaningful client commits, ≥12 meaningful server commits
- [ ] Separate GitHub repos for client & server, both with README
- [ ] All secrets in env vars; no `.env` pushed
- [ ] Fully responsive, professional wedding-themed UI (ShadCN)
- [ ] Framer Motion animations on homepage sections
- [ ] Search + category + location filters; price sort asc/desc (challenge)
- [ ] JWT verification middleware + role middleware on all protected APIs
- [ ] Server-side role verification everywhere (never UI-only)
- [ ] Premium activated ONLY via verified Stripe webhook
- [ ] ImgBB used for all image uploads
- [ ] Toast notifications (no `alert()`)
- [ ] Loading, empty, and error states everywhere
- [ ] Blocked users locked out of protected features
- [ ] Admin not creatable via public signup
- [ ] Live site: no CORS/404/504, refresh-safe routes, working Stripe, working admin login
