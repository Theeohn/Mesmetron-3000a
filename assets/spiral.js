// MESMETRON screensaver module: "spiral"
// A hollow tube spirals outward or inward from the center, and stays put
// once drawn - nothing here gets erased. The tube is literally the swept
// edges of a small circle riding the spiral centerline: at every tick we
// take the point perpendicular to the direction of travel, TR px either
// side of the centerline, and connect each side to where it was last
// frame. Two long rails build up as the head moves, plus a bright cross-
// strut every RUNG ticks - the ribs of a hose/pipe. Nothing fills in
// between the ribs, so the screen stays mostly black with a bright wound
// structure growing across it.
//
// See vortex.js/web.js for the module contract (init/draw only - app.js
// never calls id/remove on the active module). Like vortex.js, position
// is a pure function of a running tick, and the centerline radius gets
// the same small sine "breathing" wobble vortex.js puts on its rings.
//
// Knob2 selects the pattern (app.js's VARIANTS = 3):
//   0 - one tube, spiraling outward from center, wraps back to center and
//       flips rotation (CW/CCW alternate) each time it reaches the edge.
//   1 - one tube, spiraling inward from the edge, same wrap/flip.
//   2 - both at once, crossing paths as they go, weaving together over
//       time since neither ever erases the other.
//
// At a wrap (a lap just completed and the radius jumps back to its start)
// the rail-connecting line is skipped for one tick instead of drawn - a
// pen-up - otherwise you'd get one long ugly spoke drawn straight across
// the tube from the old edge position to the new center position.
//
// Radius is capped at the screen's half-height rather than the half-
// diagonal to the corners - a circle that reaches the corners spends most
// of its outer turns entirely off-screen above/below the visible area,
// which is what made the edge-in pattern lag so far behind the center-out
// one before. Staying inside the screen bounds keeps both paced evenly;
// the trade-off is the far left/right edges stay dark, which reads as a
// vignette, not a bug.

(function() {
  const CX = 240, CY = 160, MAXR = 155;
  const TR = 3;                        // tube half-width - rails sit TR px either side of the centerline
  const B = 5;                         // spiral tightness - about 5 turns across the radius range
  const WOB = 6, WRATE = 14;           // breathing wobble on the centerline radius
  const RUNG = 12;                     // ticks between cross-struts (the ribs of the tube)
  const SPD_OUT = 0.7, SPD_IN = 0.55;  // deliberately different paces - keeps modes 0/1 from syncing in mode 2

  let mode = 0, tick = 0;
  let lapA = -1, lxA = 0, lyA = 0, rxA = 0, ryA = 0;  // outward rail state
  let lapB = -1, lxB = 0, lyB = 0, rxB = 0, ryB = 0;  // inward rail state

  function tubeOut(t, spd) {  "jit";
    const lap = Math.floor(t * spd / MAXR);
    const dir = (lap % 2 === 0) ? 1 : -1;
    const base = (t * spd) % MAXR;
    const r = base + WOB * Math.sin(t / WRATE);
    const a = (base / B) * dir;
    const ca = Math.cos(a), sa = Math.sin(a);
    const cx = CX + r * ca, cy = CY + r * sa;
    return [lap, (cx - TR * sa) | 0, (cy + TR * ca) | 0, (cx + TR * sa) | 0, (cy - TR * ca) | 0];
  }

  function tubeIn(t, spd) {  "jit";
    const lap = Math.floor(t * spd / MAXR);
    const dir = (lap % 2 === 0) ? -1 : 1;
    const base = MAXR - (t * spd) % MAXR;
    const r = base + WOB * Math.sin(t / WRATE);
    const a = (base / B) * dir;
    const ca = Math.cos(a), sa = Math.sin(a);
    const cx = CX + r * ca, cy = CY + r * sa;
    return [lap, (cx - TR * sa) | 0, (cy + TR * ca) | 0, (cx + TR * sa) | 0, (cy - TR * ca) | 0];
  }

  function paintOut() {
    const g = tubeOut(tick, SPD_OUT);
    const lap = g[0], lx = g[1], ly = g[2], rx = g[3], ry = g[4];
    if (lap === lapA) {
      h.setColor(1).drawLine(lxA, lyA, lx, ly);
      h.setColor(1).drawLine(rxA, ryA, rx, ry);
    }
    if (tick % RUNG === 0) h.setColor(3).drawLine(lx, ly, rx, ry);
    lapA = lap; lxA = lx; lyA = ly; rxA = rx; ryA = ry;
  }

  function paintIn() {
    const g = tubeIn(tick, SPD_IN);
    const lap = g[0], lx = g[1], ly = g[2], rx = g[3], ry = g[4];
    if (lap === lapB) {
      h.setColor(2).drawLine(lxB, lyB, lx, ly);
      h.setColor(2).drawLine(rxB, ryB, rx, ry);
    }
    if (tick % RUNG === 0) h.setColor(3).drawLine(lx, ly, rx, ry);
    lapB = lap; lxB = lx; lyB = ly; rxB = rx; ryB = ry;
  }

  return {
    init: function(variant) {
      mode = variant;
      tick = 0;
      lapA = -1;
      lapB = -1;
    },
    draw: function(h) {  "ram";
      if (mode !== 1) paintOut();
      if (mode !== 0) paintIn();
      tick++;
    }
  };
});