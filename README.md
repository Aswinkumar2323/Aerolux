# AeroLux: Premium Flight Booking PWA

**Live Production URL:** [https://aerolux-five.vercel.app/](https://aerolux-five.vercel.app/)

AeroLux is a state-of-the-art Progressive Web App (PWA) built with **Next.js 16**, **Zustand**, and **Supabase**. It provides a highly interactive, responsive, and secure flight booking experience featuring real-time seat synchronization and atomic Postgres transactions.

---

## 🚀 Local Setup Steps

Follow these steps to run the application locally:

### 1. Install Dependencies
Ensure you have Node.js installed (v18+ recommended), then install the project dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory (or use `.env`) and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Setup Supabase Database
If you are using the Supabase CLI, start the local docker instance and push the migrations. This will automatically set up the schema, RPCs, and seed the test data:
```bash
# Start local Supabase instance
npx supabase start

# Apply all migrations and seed data
npx supabase db push
```

### 4. Start the Development Server
Run the Next.js development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

---

## 🔑 Test User Credentials

The database has been pre-seeded with a test user account for you to use. You can log in using:

- **Email:** `aswinak0330@gmail.com`
- **Password:** `123456`

---

## ☁️ Supabase Project Config

The backend is entirely powered by Postgres via Supabase. Key configurations include:

### Row Level Security (RLS)
RLS policies are strictly enforced on all tables. 
- **`seats` & `flights`:** Publicly readable.
- **`bookings`, `passengers`, `reschedules`:** Users can only `SELECT`, `INSERT`, or `UPDATE` rows where `user_id = auth.uid()`.

### Realtime Subscriptions
Supabase Realtime is enabled on the `seats` table (`alter publication supabase_realtime add table seats;`). The `BookingClient` subscribes to the `postgres_changes` channel for its specific `flight_id`. When another user books a seat, it broadcasts the payload globally, triggering a live UI pulse animation and auto-deselecting the seat if necessary.

### Atomic RPCs (Security Definer)
Because checking seat availability and inserting bookings is susceptible to race conditions, we use secure Postgres Functions (RPCs):
- **`reserve_seats_bulk`**: Safely books multiple seats and passengers in a single transaction. It locks rows via `SELECT ... FOR UPDATE`, validates `auth.uid()`, and automatically rolls back if any seat is already taken.
- **`cancel_booking` / `reschedule_booking`**: Enforces the 2-hour pre-departure rule directly in the database logic and ensures atomic rollbacks.

---

## 🧠 Zustand Store Architecture

State management is handled via **Zustand** using the `useFlightStore`. 

### Structure
The store is designed to decouple global UI state from complex server-side mutations. It manages:
- **`searchQuery`**: Remembers the user's latest flight search parameters.
- **`selectedFlight`**: Caches the currently selected flight.
- **`selectedSeats`**: Array of currently selected seat IDs.
- **`passengerDetails`**: An array of `PassengerFormState` objects that dynamically grows or shrinks depending on the number of passengers selected.

### Local Storage Persistence (`partialize`)
To ensure users don't lose their seat selection or form data if they accidentally refresh the page, the store is persisted to `localStorage`.

However, for security, the `partialize` middleware is strictly configured to **scrub sensitive data** before saving to disk.
```typescript
partialize: (state) => ({
  searchQuery: state.searchQuery,
  // ...other non-sensitive state
  passengerDetails: Array.isArray(state.passengerDetails)
    ? state.passengerDetails.map(p => ({
        ...p,
        passportNo: '' // <--- STRICTLY EXCLUDED
      }))
    : [DEFAULT_PASSENGER]
})
```
By explicitly mapping over the passenger array and wiping `passportNo`, we guarantee sensitive identity documents never touch the user's hard drive. 

### Clean Resets
When a booking successfully completes, `resetFlightStore()` is invoked. This immediately flushes `selectedSeats` and `passengerDetails` from both React state and Local Storage, ensuring that stale session data does not leak into the next transaction.

---

## ⚡ Lighthouse Performance & PWA Score

![Lighthouse Score](/lighthouse.png)
