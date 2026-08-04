// MESMETRON screensaver module: "web"
// A rotating cross-linked lattice of nodes tracing pulsing elliptical orbits.
//
// Module contract (see app.js for the full spec):
//   init(variant) - reset all internal state for the given variant (0, 1, or 2)
//   draw(h)        - render exactly one frame using the graphics handle h
// This file must evaluate to a single object with those two methods, so wrap
// everything in a self-invoking function expression: (function() { ... })()
// (note the trailing parens - unlike app.js itself, this file is invoked by
// app.js's own eval() call, not by the Pip-Boy OS, so it must invoke itself).

(function() {
  const N = 14, CX = 240, CY = 160;
  let variant = 0, tick = 0;
  const ang = new Float32Array(N);
  const spd = new Float32Array(N);
  const px = new Float32Array(N);
  const py = new Float32Array(N);

  return {
    init: function(v) {
      variant = v;
      tick = 0;
      for (let i = 0; i < N; i++) {
        ang[i] = Math.randInt(628) / 100;
        spd[i] = (Math.randInt(30) + 15) / 1000 * (i % 2 ? 1 : -1);
      }
    },
    draw: function(h) {  "ram";
      const link = variant + 3;
      h.setColor(3);
      if (tick > 0) {
        h.setColor(0);
        for (let i = 0; i < N; i++)
          h.drawLine(px[i] | 0, py[i] | 0, px[(i + link) % N] | 0, py[(i + link) % N] | 0);
        h.setColor(3);
      }
      const rx = 100 + 130 * Math.abs(Math.sin(tick / 41));
      const ry = 70 + 90 * Math.abs(Math.sin(tick / 53 + 1));
      for (let i = 0; i < N; i++) {
        ang[i] += spd[i] * (1 + variant * 0.5);
        px[i] = CX + rx * Math.cos(ang[i] * (1 + (i % 3) * 0.25));
        py[i] = CY + ry * Math.sin(ang[i] * (1 + (i % 4) * 0.18));
      }
      for (let i = 0; i < N; i++)
        h.drawLine(px[i] | 0, py[i] | 0, px[(i + link) % N] | 0, py[(i + link) % N] | 0);
      tick++;
    }
  };
});