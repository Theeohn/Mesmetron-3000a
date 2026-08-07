// MESMETRON screensaver module: "spiral"
// One spiral at a time, center-anchored, bisecting-angle starting angles.
// No retracing, no erasing, no undo, no pause - a spiral grows, and the
// instant it reaches full reach the next one starts from the same center
// point at the next bisected angle. That's it.
//
// The fix in this version: the border and core line for each segment are
// now offset using that segment's own actual direction (current point
// minus previous point, normalized), instead of an approximation based on
// the spiral's analytic angle. The old approximation used a slightly
// different offset direction depending on whether a given point was
// acting as a segment's start or its end, so consecutive segments' border
// strokes didn't quite line up at the joint between them - on a tight
// spiral with hundreds of segments, that mismatch was constant and small
// enough to look like some kind of flicker or correction happening as it
// drew, not like clean parallel lines. Computing the offset straight from
// the segment's own two endpoints removes that inconsistency - border and
// core are always parallel to the line actually being drawn, both issued
// in the same breath, one right after the other, every segment.
//
// See vortex.js/web.js for the module contract (init/draw only - app.js
// never calls id/remove on the active module).
//
// Knob2 selects the pattern (app.js's VARIANTS = 3):
//   0 - one wire per pass.
//   1 - two wires per pass, opposite each other.
//   2 - five wires per pass: three winding one way, two winding the
//       other, crossing each other as they grow.

(function() {
  const CX = 240, CY = 160;       // dead center - every spiral starts here, always
  const MAXR = 289;               // center-to-corner distance - reaches every corner
  const REV = 6;                  // revolutions per wire
  const B = MAXR / (REV * 6.283); // spiral tightness derived from the revolution count
  const RSTEP = 0.5 * 3.5;        // radius gained per tick, 250% faster than the original base pace
  const N = Math.ceil(MAXR / RSTEP);  // ticks needed for one wire to reach full reach
  const MICRO = 2;                // ticks grown per frame, per wire

  const R0 = 25;                  // radius the extra initial curl fades out over
  const EXTRA = 0.0628;           // added angular rate at r=0 (EXTRA*R0 ~ quarter turn of extra curl)

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

  function point(t, angOff, chirality) {  "jit";
    const r = t * RSTEP;
    const curl = EXTRA * R0 * (1 - Math.exp(-r / R0));
    const a = chirality * (r / B + curl) + angOff + phase;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  }

  function grow(slot, t, angOff, chirality) {
    const p = point(t, angOff, chirality);
    const x = p[0], y = p[1];
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
        grow(1, t, 2.0944, 1);
        grow(2, t, 4.1888, 1);
        grow(3, t, 0, -1);
        grow(4, t, 3.1416, -1);
      }
    }
    tick += MICRO;
    if (tick > N) {
      passIdx = (passIdx + 1) % NPASS;
      phase = bisectAngle(passIdx);
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