# Project Celestia — GCSim WASM Simulation Architecture

> **Architecture Document**: WebAssembly (WASM) Web Worker Client-Side Simulation Pipeline  
> **Status**: Approved Design Baseline (Milestone 2 Architecture Hand-off)  
> **Authoritative Baseline**: Version 7.2 Era (Nod-Krai / Snezhnaya / Natlan / Fontaine)

---

## 1. Executive Summary & Motivation

Project Celestia currently executes high-performance analytical heuristics ($<5\text{ms}$) across team generation, rotation synthesis, weapon suitability, and artifact diminishing returns. While analytical calculations deliver instantaneous UI interactivity, complex combat encounters (frame-level hitlag, ICD resets, multi-target reaction collision, and energy particle trajectory) benefit from true Monte Carlo combat simulation via **GCSim (Go Combat Simulator)** compiled to WebAssembly (`gcsim.wasm`).

To prevent blocking the React 19 UI thread during multi-iteration combat simulations (typically 100–1,000 Monte Carlo runs requiring $50\text{ms}$–$500\text{ms}$ CPU time), simulation execution is decoupled into a dedicated client-side Web Worker architecture.

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 Frontend UI                     │
│  (TeamGeneratorView / CharacterDetailModal / AbyssSolver)   │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
     1. Dispatch Config              4. Stream Results
        (Action List / Stats)           (Mean DPS, CI, Histograms)
               │                              │
┌──────────────▼──────────────────────────────┴───────────────┐
│              Dedicated Simulation Web Worker                │
│                 (`src/workers/gcsim.worker.ts`)             │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 WASM Bridge Glue                    │   │
│   │     - Action List Generator                         │   │
│   │     - Stat & Weapon Mapper                          │   │
│   │     - JSON Result Unmarshaller                      │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │                 `gcsim.wasm` Module                 │   │
│   │   - 60 FPS Tick Engine                              │   │
│   │   - Hitlag & ICD State Machine                      │   │
│   │   - Aura Gauge & Reaction Decoupler                 │   │
│   │   - 100–1,000 Iteration Monte Carlo Simulation      │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Components

### 2.1 The Web Worker Boundary (`src/workers/gcsim.worker.ts`)
The Web Worker operates in an isolated JavaScript runtime thread. It maintains:
- Instantiated WebAssembly memory buffer ($16\text{MB}$ initial, growable to $64\text{MB}$).
- Sandboxed lifecycle decoupled from user navigation.
- Safe abort and cancellation via `AbortController` signal tokens.

### 2.2 Translation & Action List Synthesizer
Celestia's SSOT models characters, weapons, artifact sets, and rotation sequences in TypeScript (`SynthesizedTeamRotation`). The Worker converts this structured state into GCSim's domain-specific configuration language:

```ini
# Auto-generated GCSim Config from Celestia SSOT
nefer char lvl=90/90 cons=0 talent=9,9,9;
nefer add weapon="reliquaryoftruth" lvl=90/90 refine=1;
nefer add set="gildeddreams" count=4;

furina char lvl=90/90 cons=0 talent=9,9,9;
furina add weapon="fleuvecendreferryman" lvl=90/90 refine=5;
furina add set="goldentroupe" count=4;

# Target Dummy Configuration
target lvl=100 pyro=0.1 hydro=0.1 dendro=0.1 electro=0.1 anemo=0.1 cryo=0.1 geo=0.1;

# Sequenced Rotation Execution
active furina;
furina skill, burst;
active nefer;
nefer skill, charge:3;
```

---

## 3. Communication Protocol & Message Schema

Communication between the UI thread and the Simulation Worker utilizes strictly typed, structured-cloned JSON messages over `postMessage`.

### 3.1 Request Payload (`SimulationRequestMessage`)
```typescript
export interface SimulationRequestMessage {
  type: 'RUN_SIMULATION';
  requestId: string;
  team: {
    characters: Array<{
      id: string;
      level: number;
      constellation: number;
      talents: { auto: number; skill: number; burst: number };
      weapon: { key: string; level: number; refinement: number };
      artifacts: { setKey: string; count: number };
      stats: Record<string, number>;
    }>;
    rotation: TeamRotationStep[];
  };
  options: {
    iterations: number; // Default: 250 (fast preview) or 1000 (deep audit)
    targetCount: number; // Default: 1
    durationSeconds: number; // Default: 90
    seed?: number;
  };
}
```

### 3.2 Response Payloads (`SimulationResponseMessage`)
```typescript
export type SimulationResponseMessage =
  | {
      type: 'SIM_PROGRESS';
      requestId: string;
      progressPct: number; // 0 to 100
      currentIteration: number;
    }
  | {
      type: 'SIM_SUCCESS';
      requestId: string;
      result: {
        meanDps: number;
        medianDps: number;
        minDps: number;
        maxDps: number;
        standardDeviation: number;
        confidenceInterval95: [number, number];
        damageBreakdownByCharacter: Record<string, number>;
        damageBreakdownByElement: Record<string, number>;
        executionTimeMs: number;
      };
    }
  | {
      type: 'SIM_ERROR';
      requestId: string;
      error: string;
      fallbackUsed: boolean;
    };
```

---

## 4. Hybrid Recommendation Pipeline

Celestia operates on a **Two-Tier Staged Delivery Pipeline**:

1. **Tier 1 — Instant Analytical Heuristic ($<5\text{ms}$)**:
   - When a user views recommendations or adjusts team rosters, `scoreCandidateForSlot`, `synthesizeTeamRotation`, and `assignOptimalTeamWeapons` execute synchronously.
   - The UI immediately renders **Composition Compatibility Score** and structured rotation steps.
   - The user experiences 0 UI lag or frame drops.

2. **Tier 2 — Measured Simulation Convergence ($100\text{ms}–400\text{ms}$)**:
   - In the background, the UI worker pool submits the synthesized rotation to `gcsim.wasm`.
   - Once computed, the badge dynamically transitions from `Estimated Heuristic` to `Measured WASM DPS: X,XXX dps (±Y%)`.
   - If WebAssembly is unsupported, blocked by browser CSP, or encounters an unrecognized kit passive, the app transparently falls back to Tier 1 without user interruption.

---

## 5. Security & Resource Guardrails

- **Zero Memory Leaks**: Worker terminates and reclaims memory buffers if memory pressure exceeds $96\text{MB}$.
- **Execution Timeout**: Any simulation taking $>3.0\text{s}$ is automatically aborted via `worker.terminate()` and re-spawned.
- **Offline Capable**: `gcsim.wasm` is statically bundled in assets or loaded on-demand via CacheStorage, operating entirely offline without telemetry or third-party servers.
