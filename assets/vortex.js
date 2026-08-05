// MESMETRON screensaver module: "vortex"
// Concentric rotating rings, pseudo-3D tunnel-flythrough effect.
// See web.js for the module contract (init/draw) and file-wrapping convention.
//
// NOTE: this mode has a known erase/redraw mismatch (recomputes the previous
// frame's ring geometry from tick-1, which doesn't exactly cancel what was
// drawn). This was found and understood, but is being left in deliberately:
// the leftover trails it produces are a desired visual effect, not a bug to
// fix. Do not "fix" it.

(function() {
  const CX = 240, CY = 160;
  let variant = 0, tick = 0;

  return {
    init: function(v) {
      variant = v;
      tick = 0;
    },
    draw: function(h) {  "ram";
      h.setColor(3);
      // Adjusted to produce 3, 4, and 5 sided shapes based on variant (0, 1, 2)
      const sides = 3 + variant;
      const rot = tick / 45;
      if (tick > 0) {
        h.setColor(0);
        for (let r = 30; r < 340; r += 55) {
          const rr = r + 22 * Math.sin((tick - 1) / 18 + r);
          const pr = (tick - 1) / 30 + r * 0.01;
          for (let i = 0; i < sides; i++) {
            const a0 = pr + i * 6.283 / sides, a1 = pr + (i + 1) * 6.283 / sides;
            h.drawLine((CX + rr * Math.cos(a0)) | 0, (CY + rr * 0.75 * Math.sin(a0)) | 0,
              (CX + rr * Math.cos(a1)) | 0, (CY + rr * 0.75 * Math.sin(a1)) | 0);
          }
        }
        h.setColor(3);
      }
      for (let r = 30; r < 340; r += 55) {
        const rr = r + 22 * Math.sin(tick / 18 + r);
        const pr = rot + r * 0.01;
        for (let i = 0; i < sides; i++) {
          const a0 = pr + i * 6.283 / sides, a1 = pr + (i + 1) * 6.283 / sides;
          h.drawLine((CX + rr * Math.cos(a0)) | 0, (CY + rr * 0.75 * Math.sin(a0)) | 0,
            (CX + rr * Math.cos(a1)) | 0, (CY + rr * 0.75 * Math.sin(a1)) | 0);
        }
      }
      tick++;
    }
  };
});