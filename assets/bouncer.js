// MESMETRON screensaver module: "bouncer"
// A single rotating polygon bouncing off all four screen edges.
// See web.js for the module contract (init/draw) and file-wrapping convention.

(function() {
  let variant = 0, tick = 0;
  let cx = 240, cy = 160, vx = 0, vy = 0, rot = 0;

  return {
    init: function(v) {
      variant = v;
      tick = 0;
      const spdMul = 1 + variant * 0.4;
      cx = 240; cy = 160;
      vx = 1.3 * spdMul; vy = 1.7 * spdMul;
      rot = 0;
    },
    draw: function(h) {  "ram";
      const sides = 3 + variant;
      const spdMul = 1 + variant * 0.4;
      const size = 55;
      h.setColor(3);
      if (tick > 0) {
        h.setColor(0);
        for (let i = 0; i < sides; i++) {
          const a0 = rot + i * 6.283 / sides, a1 = rot + (i + 1) * 6.283 / sides;
          h.drawLine((cx + size * Math.cos(a0)) | 0, (cy + size * Math.sin(a0)) | 0,
            (cx + size * Math.cos(a1)) | 0, (cy + size * Math.sin(a1)) | 0);
        }
        h.setColor(3);
      }
      cx += vx; cy += vy; rot += 0.05 * spdMul;
      if (cx < size || cx > 480 - size) vx = -vx;
      if (cy < size || cy > 320 - size) vy = -vy;
      cx = E.clip(cx, size, 480 - size);
      cy = E.clip(cy, size, 320 - size);
      for (let i = 0; i < sides; i++) {
        const a0 = rot + i * 6.283 / sides, a1 = rot + (i + 1) * 6.283 / sides;
        h.drawLine((cx + size * Math.cos(a0)) | 0, (cy + size * Math.sin(a0)) | 0,
          (cx + size * Math.cos(a1)) | 0, (cy + size * Math.sin(a1)) | 0);
      }
      tick++;
    }
  };
});