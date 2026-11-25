# Shilpi Web Portal

## Overview
Desktop studio companion and web terminal for the Shilpi Studio ERP platform, built using Next.js 15, React 19, Tailwind CSS 3, GSAP, and Socket.io Client. Serves as a high-resolution dashboard for salon receptionists, owners, and beauticians, featuring a WhatsApp-style QR code instant pairing terminal.

## Interface
- **Application Shell**: `src/pages/_app.tsx` integrating Tailwind CSS styles, layout wrappers, and fonts.
- **Main Terminal Screen**: `src/pages/index.tsx`
  - Dynamic QR code generation for mobile-to-desktop pairing.
  - Real-time authorization listener transitioning from login QR to studio dashboard.
  - Studio overview widgets: revenue summaries, upcoming bridal orders, and client roster.
- **UI Components & Views**: `src/components/`
  - `LoginExperience.tsx`: Real-time QR terminal pairing display with connection countdown.
  - `StudioSidebar.tsx`: Desktop navigation bar with Indian cultural palette styling.
  - Studio Views: `DashboardView`, `CustomersView`, `PackagesView`, `PaymentsView`, `GalleryView`, `RemindersView`, `NotificationsView`, `ExpensesView`, `ReportsView`, `SubscriptionView`, `SettingsView`.
- **Communication Layer**:
  - `src/services/api.ts`: HTTP client connecting to `shilpi-backend` (`http://localhost:4000/api/v1`).
  - `src/services/socket.ts`: Socket.io client binding to backend pairing gateway for instant session activation.

## Invariants
- `[qrPairing]` QR pairing tokens are single-use and time-bound (5-minute TTL); terminal automatically generates fresh session upon expiration.
- `[auth:session]` Once authorized via mobile camera scan, web client exchanges the temporary pairing code for a full beautician JWT.
- `[display]` High-altitude desktop layout optimized for screens $\ge 1024\text{px}$.

## Side Effects
- Establishes persistent WebSocket connection to `shilpi-backend` on port `4000`.
- Mutates browser `localStorage` to retain authenticated beautician sessions.
- Performs REST API requests against `shilpi-backend` for dashboard aggregates and booking schedules.

## Verification
- Run: `npm run lint`
