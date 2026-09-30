# HousingAnywhere — move-out to the next trusted move-in

A clickable two-phone prototype of journey phase 07: Alex (tenant) checks out with
anchor-guided photos, the tenant agent compares them with move-in, the landlord agent
settles the deposit and relists, Lucia approves, and Alex gets his deposit back.
The dark bar below the phones is the agent, translating what is processed.

Open `index.html` over HTTP:

```sh
python3 -m http.server 8822   # → http://localhost:8822
```

Best at 1920×1080 in full screen. At 1280×720 the phones get small (half size).

## What is real and what is simulated

| | |
|---|---|
| **Real** | Every tap, the drag-to-align viewfinder, the before/after slider |
| **Simulated (DEMO)** | Anchor detection, the AI comparison, payment and relisting. Always the same scripted outcome |

No backend, no API keys, no external requests.

## Demo script (≈ 3 minutes)

The phone whose turn it is glows; the other dims. `→` / `←` step, `R` resets.

1. **Alex's lock screen** — tap *Your checkout is ready*. Lucia: "nothing needed from you".
2. **Checkout** — 4 rooms, 12 anchor shots from move-in. Tap *Start with the bedroom*.
3. **Anchor capture** — the ghost is the move-in photo, dashed rings are its anchors.
   Drag the view so the orange dots meet the rings (or just tap): they turn green and the
   shutter fires. Second shot the same. Then *Auto-capture remaining 10*.
4. **Comparing** runs by itself — Lucia's phone says she doesn't need to be there.
5. **Inspection report** — drag the slider: scuff = normal wear, no charge; stain = €40.
   Tap *Looks fair — send to Lucia*. (Optional side step: *Don't agree — involve human
   support* shows the escalation to a specialist on both phones; *Back to report* returns.)
6. **Lucia** gets the agent's proposal — tap *Approve & relist*. Point out: agent
   proposes, rules calculate, a human decides.
7. The checklist runs; Lucia's listing goes live with *Condition verified*.
8. **Alex** gets *€210 is on its way* — deposit €250, minus €40 cleaning. End of the demo.

Restart top right.

## Files

```
index.html   two phone frames + agent bar
styles.css   HA design tokens (from virtual-tour-demo) + layout
app.js       step machine, both phones, viewfinder, agent bar
assets/      room photos (from virtual-tour-demo)
```

Room photos: rendered from Poly Haven panoramas (CC0), same as `virtual-tour-demo` — see its `CREDITS.md`.
