# Authentication Implementation Plan

This document outlines the authentication system, which supports both anonymous and authenticated (Google OAuth) users through a single, unified sign-in flow.

### Core Requirements:
1.  **Always-on Auth**: A user session (anonymous or logged-in) must always exist to ensure progress is tracked.
2.  **Unified Sign-In**: A single "Sign in with Google" button handles all authentication scenarios.
3.  **Data Preservation**: When an anonymous user signs in for the first time, their progress and vocabulary data are seamlessly migrated to their new permanent account.
4.  **State Sync**: The UI state, Supabase Auth user, and the `profiles` table remain synchronized.

---

## The Implementation

### 1. The `useAuth` Hook: Intelligent Sign-In Logic

The core of the system resides in the `useAuth` hook, which exposes a single `signInWithGoogle` function. This function intelligently handles the two primary user journeys:

*   **First-Time Sign-In (Linking):** For an anonymous user, the function first attempts to link their session to a Google account using `supabase.auth.linkIdentity()`. This preserves all data collected during the anonymous session.
*   **Returning User Sign-In (Logging In):** If the `linkIdentity` call fails because the Google account is already in use, the error is caught. The function then proceeds to sign the user in normally with `supabase.auth.signInWithOAuth()`, loading their existing account data.

The `signOut` function ensures a user is immediately transitioned to a new anonymous session upon logging out, preventing any state where a user is session-less.

### 2. Backend Profile Creation: `userActions.ts`

The `createUserProfile` server action is responsible for creating a new entry in the `profiles` table. To prevent race conditions during the rapid logout/anonymous-login flow, this action does not perform its own session validation. It trusts the `authUserId` passed from the client-side Supabase session, which is established immediately after a successful sign-in or linking event.

### 3. UI: `NewspaperHeader.tsx`

The user interface presents a simple, clear authentication state:
*   **Anonymous User**: Sees a single "Sign in with Google" button.
*   **Authenticated User**: Sees their email and a "Sign Out" button.

This removes any ambiguity for the user, as a single action handles all authentication logic behind the scenes.

---

## Authentication Flow Diagram

This diagram illustrates the intelligent error-handling flow that powers the unified sign-in experience.

```mermaid
sequenceDiagram
    participant Client as Client (UI)
    participant AuthHook as useAuth.ts
    participant Supabase

    Note over Client, Supabase: Anonymous user clicks "Sign In with Google"

    Client->>AuthHook: Calls unified signInWithGoogle()
    AuthHook->>Supabase: Attempts supabase.auth.linkIdentity()

    alt Linking Succeeds (First-time sign-in)
        Supabase-->>AuthHook: Success! Anonymous user is now linked.
        Note right of AuthHook: Data is preserved. Flow is complete.
    else Linking Fails (Identity already exists)
        Supabase-->>AuthHook: Returns 'identity_already_in_use' error
        AuthHook->>AuthHook: Catches specific error and proceeds to fallback
        AuthHook->>Supabase: Calls supabase.auth.signInWithOAuth()
        Note right of AuthHook: Signs user into their existing account.<br/>Current anonymous data is correctly discarded.
        Supabase-->>AuthHook: Success! User is logged in.
    end