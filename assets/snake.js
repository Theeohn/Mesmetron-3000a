// MESMETRON screensaver module: "snake"
// A 9px round brush traces an Archimedean spiral (r = B*theta), coil pitch
// tuned just under the brush width, so a completed pass paints the screen
// edge-to-edge with no gaps - a spinning, wiping fill rather than a thin
// line. See vortex.js/web.js for the module contract (init/draw only, no
// id/remove needed here - app.js never calls either on the active module).
//
// Like vortex.js, draw() never calls a full h.clear() - it only ever
// touches the pixels of the shape it's drawing. That persistence is what
// turns a plain restart into a wipe: when a pass finishes, the brush resets
// to its start point, flips rotation (CW/CCW alternate each pass) and
// steps to the next palette color, painting straight over the previous
// pass instead of a hard cut.
//
// Knob2 selects the pattern (app.js's VARIANTS = 3):
//   0 - one snake, center -> edge outward.
//   1 - one snake, edge -> center inward.
//   2 - both at once, crossing paths in the middle.
//
// vortex.js's erase pass deliberately recomputes the prior frame's ring
// geometry at the wrong rotation rate (tick-1 fed through /30 instead of
// /45) - a known mismatch, kept on purpose because the imperfect erase is
// what makes the trails. Copying that exact trick here would fight the
// point of this module (a full, gapless fill), so instead modes 0 and 2
// both give the two brushes the *same* coil pitch (gapless on their own)
// but a deliberately mismatched pace: the outward and inward snakes
// advance at different arc-length rates, so in mode 2 they never lock into
// a fixed relationship - the ring where they cross keeps drifting pass to
// pass. Same idea as vortex's note (an intentional, uncorrected mismatch
// is the effect, not a bug), just applied as a timing offset instead of a
// literal erase.

(function() {
  const CX = 240, CY = 160, MAXR = 289, BR = 4;  // center, corner-covering radius, 9px brush
  const B = 8 / 6.283;               // coil pitch: 8px/turn, under the 9px brush - gapless on its own
  const K_OUT = 2 * 5 * B;           // outward snake: ~5px of arc length per tick
  const K_IN = 2 * 4 * B;            // inward snake: ~4px per tick - deliberately off the outward pace
  const MICRO = 4;                   // brush stamps drawn per frame
  const PAL = [3, 1, 2];             // bright / amber / dim, cycled each completed pass

  let mode = 0;
  let tA = 0, dirA = 1, colA = 0;    // outward snake (modes 0 and 2)
  let tB = 0, dirB = -1, colB = 2;   // inward snake  (modes 1 and 2)

  function paintOut() {
    for (let i = 0; i < MICRO; i++) {
      const r = Math.sqrt(K_OUT * tA);
      if (r >= MAXR) { tA = 0; dirA = -dirA; colA = (colA + 1) % 3; continue; }
      const a = (r / B) * dirA;
      h.setColor(PAL[colA]).fillCircle((CX + r * Math.cos(a)) | 0, (CY + r * Math.sin(a)) | 0, BR);
      tA++;
    }
  }

  function paintIn() {
    for (let i = 0; i < MICRO; i++) {
      const rr = MAXR * MAXR - K_IN * tB;
      if (rr <= 0) { tB = 0; dirB = -dirB; colB = (colB + 1) % 3; continue; }
      const r = Math.sqrt(rr);
      const a = (r / B) * dirB;
      h.setColor(PAL[colB]).fillCircle((CX + r * Math.cos(a)) | 0, (CY + r * Math.sin(a)) | 0, BR);
      tB++;
    }
  }

  return {
    init: function(variant) {
      mode = variant;
      tA = 0; dirA = 1; colA = 0;
      tB = 0; dirB = -1; colB = 2;
    },
    draw: function(h) {  "ram";
      if (mode !== 1) paintOut();
      if (mode !== 0) paintIn();
    }
  };
});