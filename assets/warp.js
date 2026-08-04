// MESMETRON screensaver module: "warp"
// A radiating starfield with streaking trails, like warp-speed travel.
// See web.js for the module contract (init/draw) and file-wrapping convention.

(function() {
  const N = 14, CX = 240, CY = 160;
  let variant = 0, tick = 0;
  const ang = new Float32Array(N);
  const dist = new Float32Array(N);

  return {
    init: function(v) {
      variant = v;
      tick = 0;
      for (let i = 0; i < N; i++) {
        ang[i] = Math.randInt(628) / 100;
        dist[i] = Math.randInt(300);
      }
    },
    draw: function(h) {  "ram";
      h.setColor(3);
      const step = 3 + variant * 3;
      for (let i = 0; i < N; i++) {
        const cs = Math.cos(ang[i]), sn = Math.sin(ang[i]);
        const d0 = dist[i];
        const d0tail = Math.max(d0 - (6 + d0 / 12), 0);
        if (tick > 0) {
          h.setColor(0);
          h.drawLine((CX + cs * d0) | 0, (CY + sn * d0) | 0,
            (CX + cs * d0tail) | 0, (CY + sn * d0tail) | 0);
          h.setColor(3);
        }
        let d1 = d0 + step * (1 + d0 / 90);
        if (d1 > 340) { d1 = 4; ang[i] = Math.randInt(628) / 100; }
        dist[i] = d1;
        const cs1 = Math.cos(ang[i]), sn1 = Math.sin(ang[i]);
        const d1tail = Math.max(d1 - (6 + d1 / 12), 0);
        h.drawLine((CX + cs1 * d1) | 0, (CY + sn1 * d1) | 0,
          (CX + cs1 * d1tail) | 0, (CY + sn1 * d1tail) | 0);
      }
      tick++;
    }
  };
});