# 0012. Account Connection Security and Canonical Onboarding Paths

## Context

Project Celestia requires game account data (roster, levels, talents, weapons, artifacts, materials) to provide personalized progression and team optimization. Historically, three competing ingestion mechanisms emerged across branches:

1. **Public Showcase Refresh (Enka.Network)**: UID-based HTTP lookup requiring zero credentials, fetching 8–12 showcased characters with equipped gear.
2. **Offline Format Import (GOOD JSON)**: Standardized open export format containing the full account inventory, pasted as text without credentials.
3. **Session Cookie Synchronization (HoYoLAB / Extension)**: Unpacked browser extension or manual cookie pasting requesting session tokens (`ltuid_v2`, `lttoken_v2`) to pull live game records directly from HoYoLAB.

An external product security review warned that requiring ordinary players to inspect browser developer tools and paste sensitive session cookies creates severe account security risks, high UX intimidation, and credential exposure liability. Simultaneously, loading unpacked browser extensions via developer mode introduces substantial onboarding friction.

## Decision

1. **UID-First Public Showcase is Canonical Default**: Public UID showcase refresh via Enka.Network is established as the primary, zero-friction onboarding path. Any visitor entering a 9-digit UID immediately receives a personalized Today dashboard, simulation rankings, and farming priorities with zero sign-up friction.
2. **GOOD JSON Import is Canonical Complete Inventory Path**: For players desiring full account evaluation beyond the 8–12 showcased characters, offline GOOD JSON import is the canonical method. It provides complete inventory without requiring credentials or session tokens.
3. **Permanent Rejection of Manual Cookie Pasting**: Manual developer-tools session cookie input is permanently rejected and removed from production UI. Production forms will never request, parse, or store raw HoYoLAB session cookies.
4. **Browser Extension Relegated to Advanced Experimental Tooling**: The unpacked browser connector is isolated as optional developer/research tooling, completely decoupled from the standard onboarding workflow.
5. **Truth in Data Boundaries**: Public showcase analysis must explicitly communicate its boundaries: unshowcased roster units and unequipped inventory are categorized as `inventoryStatus: 'unknown'` rather than assumed unowned or 0.

## Consequences

- **Security Guarantee**: Zero possibility of user account takeover or session hijacking through Project Celestia.
- **Onboarding Speed**: Users receive immediate value within 5 seconds of entering their UID.
- **Data Transparency**: The UI clearly displays data provenance and avoids misleading claims regarding unobserved inventory.
