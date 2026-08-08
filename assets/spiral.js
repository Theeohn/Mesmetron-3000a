// MESMETRON screensaver module: "spiral"
// One pattern at a time, bisecting-angle starting angles. The instant one
// finishes, tick resets and the next starts at the next bisected angle,
// same frame. There is no pause, wait, or sleep anywhere in this file -
// paint() does real drawing work on every single call, unconditionally.
// If a gap is still visible after this update, it isn't coming from a
// pause branch (there isn't one to remove), which points at the real
// per-frame time on the actual hardware running longer than the 40ms
// app.js assumes once there's more to draw - see the note on mode 2 below.
//
// Border and core for each segment are offset using that segment's own
// actual direction (current point minus previous point, normalized)
// rather than an approximation from the spiral's analytic angle - keeps
// them exactly parallel to the line actually being drawn, both issued
// back to back, every segment.
//
// See vortex.js/web.js for the module contract (init/draw only - app.js
// never calls id/remove on the active module).
//
// Knob2 selects the pattern (app.js's VARIANTS = 3):
//   0 - one wire, spiraling outward from center.
//   1 - two wires, spiraling outward from center, opposite each other.
//   2 - four wires: two spiraling outward from center (opposite each
//       other), and two more spiraling inward from the display's edge
//       (also opposite each other, wound the other direction). Both
//       pairs use the exact same spiral math - one pair grows r from 0
//       up to the edge, the other shrinks r from the edge down to 0 - and
//       they cross each other continuously as they grow. This is twice
//       the draw calls per tick of mode 1, so if a lag shows up on real
//       hardware it'll show up here first - MICRO below is the lever to
//       pull (draws fewer ticks per frame, same total ticks either way).

(function() {
  const CX = 240, CY = 160;       // dead center
  const MAXR = 289;               // center-to-corner distance - every wire's full reach
  const REV = 6;                  // revolutions per wire
  const B = MAXR / (REV * 6.283); // spiral tightness derived from the revolution count
  const RSTEP = 0.5 * 3.5;        // radius covered per tick
  const N = Math.ceil(MAXR / RSTEP);  // ticks needed for one wire to cover its full reach
  const MICRO = 2;                // ticks grown per frame, per wire

  const R0 = 25;                  // radius the extra curl fades out over, measured from whichever
                                  // end of a wire is currently near r=0 (center)
  const EXTRA = 0.0628;           // added angular rate near r=0 (EXTRA*R0 ~ quarter turn of extra curl)

  const CORE_OFF = 1;             // core stroke offset either side of centerline -> ~2-3px thick
  const BORDER_OFF = 3;           // border stroke offset - a dark outline a few px further out

  const NPASS = 100;              // passes per color scheme before inverting
  const ANGLE_BITS = 7;           // resolution of the bisecting sequence (128 possible angles)

  let mode = 0, tick = 0, passIdx = 0, phase = 0, invert = false;
  let coreColor = 3, borderColor = 0;
  let px = [0, 0, 0, 0, 0], py = [0, 0, 0, 0, 0], started = [false, false, false, false, false];

  function bisectAngle(n) {
    let rev = 0, v = n;
    for (let i = 0; i < ANGLE_BITS; i++) {
      rev = (rev << 1) | (v & 1);
      v >>= 1;
    }
    return (rev / (1 << ANGLE_BITS)) * 6.283;
  }

  function point(t, angOff, chirality) {  "jit";        // outward: r grows from 0 to MAXR
    const r = t * RSTEP;
    const curl = EXTRA * R0 * (1 - Math.exp(-r / R0));
    const a = chirality * (r / B + curl) + angOff + phase;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  }

  function pointIn(t, angOff, chirality) {  "jit";       // inward: r shrinks from MAXR to 0
    let r = MAXR - t * RSTEP;
    if (r < 0) r = 0;
    const curl = EXTRA * R0 * (1 - Math.exp(-r / R0));
    const a = chirality * (r / B + curl) + angOff + phase;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  }

  function stroke(slot, x, y) {
    if (started[slot]) {
      const ox = px[slot], oy = py[slot];
      const dx = x - ox, dy = y - oy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len, ny = dx / len;
      h.setColor(borderColor);
      h.drawLine((ox + nx * BORDER_OFF) | 0, (oy + ny * BORDER_OFF) | 0, (x + nx * BORDER_OFF) | 0, (y + ny * BORDER_OFF) | 0);
      h.setColor(coreColor);
      h.drawLine((ox + nx * CORE_OFF) | 0, (oy + ny * CORE_OFF) | 0, (x + nx * CORE_OFF) | 0, (y + ny * CORE_OFF) | 0);
      h.setColor(borderColor);
      h.drawLine((ox - nx * BORDER_OFF) | 0, (oy - ny * BORDER_OFF) | 0, (x - nx * BORDER_OFF) | 0, (y - ny * BORDER_OFF) | 0);
      h.setColor(coreColor);
      h.drawLine((ox - nx * CORE_OFF) | 0, (oy - ny * CORE_OFF) | 0, (x - nx * CORE_OFF) | 0, (y - ny * CORE_OFF) | 0);
    }
    px[slot] = x; py[slot] = y; started[slot] = true;
  }

  function grow(slot, t, angOff, chirality) {
    const p = point(t, angOff, chirality);
    stroke(slot, p[0], p[1]);
  }

  function growIn(slot, t, angOff, chirality) {
    const p = pointIn(t, angOff, chirality);
    stroke(slot, p[0], p[1]);
  }

  function paint() {
    for (let i = 0; i < MICRO; i++) {
      const t = tick + i;
      if (t > N) continue;
      if (mode === 0) {
        grow(0, t, 0, 1);
      } else if (mode === 1) {
        grow(0, t, 0, 1);
        grow(1, t, 3.1416, 1);
      } else {
        grow(0, t, 0, 1);
        grow(1, t, 3.1416, 1);
        growIn(2, t, 0, -1);
        growIn(3, t, 3.1416, -1);
      }
    }
    tick += MICRO;
    if (tick > N) {
      passIdx = (passIdx + 1) % NPASS;
      // modes 1 and 2 pair a wire at angOff=0 with one at angOff=PI, so the
      // visible pattern only depends on phase mod PI. bisectAngle's lowest
      // bit always lands on the PI bit of the result and alternates every
      // single pass, which - for a PI-paired mode - just swaps which wire
      // is which without changing what's on screen: passIdx*2 drops that
      // redundant bit so every pass gets a genuinely new angle instead of
      // retracing the pass that just finished.
      phase = bisectAngle(mode === 0 ? passIdx : passIdx * 2);
      if (passIdx === 0) {
        invert = !invert;
        coreColor = invert ? 0 : 3;
        borderColor = invert ? 3 : 0;
      }
      tick = 0;
      started[0] = started[1] = started[2] = started[3] = started[4] = false;
    }
  }

  return {
    init: function(variant) {
      mode = variant;
      tick = 0;
      passIdx = 0;
      phase = 0;
      invert = false;
      coreColor = 3; borderColor = 0;
      started[0] = started[1] = started[2] = started[3] = started[4] = false;
    },
    draw: function(h) {  "ram";
      paint();
    }
  };
});