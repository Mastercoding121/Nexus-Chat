# Project: Nexus Chat

## Overview
Nexus Chat is a modern messaging and community experience built with React, Vite, Tailwind CSS, and a Supabase-ready persistence layer. The app now combines a polished landing experience, secure member authentication, a protected chat shell, and a lightweight investment hub.

## Current Status (2026-07-11)
- ✅ Reworked the app from a mock preview into a branded multi-page experience
- ✅ Added a public landing page with animated branding, theme switching, and download/investment calls to action
- ✅ Implemented auth routes for login, registration, password recovery, and reset flows
- ✅ Added member-based signup and sign-in with a unique member number and password
- ✅ Wired authentication to a Supabase-backed member store with localStorage fallback
- ✅ Added chat-shell routing under /app and protected access for the main experience
- ✅ Added wallpaper customization and settings support in the chat experience
- ✅ Added voice-call and end-to-end-encryption scaffolding for future expansion
- ✅ Added a public investment page with ROI-focused content and CTA sections

## Main Experience Areas
- Landing and auth: [src/pages/AuthLanding.jsx](src/pages/AuthLanding.jsx), [src/pages/Login.jsx](src/pages/Login.jsx), [src/pages/Register.jsx](src/pages/Register.jsx)
- App routing and protection: [src/App.jsx](src/App.jsx), [src/components/ProtectedRoute.jsx](src/components/ProtectedRoute.jsx)
- Auth state and persistence: [src/lib/AuthContext.jsx](src/lib/AuthContext.jsx), [src/lib/supabase.ts](src/lib/supabase.ts)
- Chat UI and layout: [src/layouts/ChatLayout.jsx](src/layouts/ChatLayout.jsx), [src/pages/ChatPage.jsx](src/pages/ChatPage.jsx)
- Visual system and branding: [src/index.css](src/index.css), [index.html](index.html)

## Key Implementation Notes
- The app uses a hybrid persistence strategy: Supabase is the preferred backend for member accounts, while localStorage remains a fallback for local development and offline resilience.
- The theme system is persistent via localStorage and applies across the public and authenticated experience.
- The UI uses CSS-driven animations instead of package-heavy motion libraries for stability.
- The project includes an SQL schema for member persistence in [supabase-schema.sql](supabase-schema.sql).

## Current Feature Set
- Secure member registration with automatically generated member number
- Password-protected sign-in flow for returning users
- Protected chat area with responsive layout and chat panels
- Download options for Android, PC, Tablet, Mac, and iPhone
- Wallpapers, settings, and profile-oriented chat customization
- Investment landing experience with product highlights and CTA flows

## Next Priorities
- Verify the full auth and persistence flow in the browser
- Confirm Supabase table access and policies in the connected project
- Polish any remaining UI details and expand feature completeness across chat actions
