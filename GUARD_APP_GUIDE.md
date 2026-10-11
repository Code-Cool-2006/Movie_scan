# Movie Ticket Scanning & Check-in Mobile App (Guard App)

## Overview
This is the **Guard Mobile App** built with **React Native + Expo SDK 54** and **Expo Router**.
It enables cinema door security staff to scan customer ticket QR codes, enforce admission rules, inspect bookings, monitor today's attendance, and audit all entries.

## Key Endpoints Implemented
- **POST `/scan`** – Scans and validates a ticket for entry (handles atomic admission, duplicate detection, wrong theatre rejection).
- **GET `/scan/:ticketCode`** – Inspects ticket details (movie, screen, seats, time, customer) prior to check-in.
- **GET `/staff/scan-logs`** – Fetches the complete audit history of all scanned tickets with search and status filters.
- **GET `/staff/shows/today`** – Live door capacity progress (booked vs. entered guests per show).

## Features
1. **Camera QR Scanner (`Scanner` Tab)**:
   - Full-screen `CameraView` with animated scanning reticle, laser line, flashlight/torch toggle, and camera flip.
   - Real-time `busy` debouncing to prevent multiple simultaneous reads.
   - Haptic vibration feedback on scan detection.
   - Pops up high-visibility green **ADMIT** or red **REJECT** result cards.
2. **Manual Ticket Entry (`Manual Entry` Tab)**:
   - Keyboard lookup (`GET /scan/:ticketCode`) for damaged or smudged QR codes.
   - Quick Test Ticket presets (`TKT-DUNE2-109`, `TKT-AVATAR-881`, `TKT-USED-999`, etc.).
   - 1-tap admission execution.
3. **Live Attendance (`Today's Shows` Tab)**:
   - Progress bars showing admitted vs booked seats per screen.
   - Pull-to-refresh monitoring.
4. **Scan History (`Scan Logs` Tab)**:
   - Searchable, filterable audit log of all admissions and rejections.
5. **Dual Connectivity**:
   - Built-in **Mock/Demo Engine** for zero-dependency standalone testing.
   - Configurable Live Backend Base URL in Settings (`app/settings.tsx`).

## Running the App
```bash
# Start development server
npx expo start

# Run typecheck
npx tsc --noEmit

# Run linter
npx expo lint

# Run diagnostic check
npx expo-doctor

# Run verification test script
node scripts/test-scan-system.mjs
```
