// MESMETRON screensaver module: "ribbon"
// A 4-segment Lissajous tail chasing itself around the display.
// See web.js for the module contract (init/draw) and file-wrapping convention.

(function() {
  const CX = 240, CY = 160;
  let variant = 0, tick = 0;
  const px = new Float32Array(4);
  const py = new Float32Array(4);

  return {
    init: function(v) {
      variant = v;
      tick = 0;
    },
    draw: function(h) {  "ram";
      const spdMul = 1 + variant * 0.6;
      const t = tick / 26 * spdMul;
      const freqA = 3.1 + variant * 0.4;
      const freqB = 2.3 + variant * 0.3;
      const nx = CX + 230 * Math.sin(freqA * t + Math.sin(t / 4.7));
      const ny = CY + 150 * Math.sin(freqB * t);
      h.setColor(3);
      if (tick > 10) {
        h.setColor(0);
        h.drawLineAA(px[3] | 0, py[3] | 0, px[2] | 0, py[2] | 0);
        h.setColor(3);
      }
      px[3] = px[2]; py[3] = py[2];
      px[2] = px[1]; py[2] = py[1];
      px[1] = px[0]; py[1] = py[0];
      px[0] = nx; py[0] = ny;
      h.drawLineAA(px[0] | 0, py[0] | 0, px[1] | 0, py[1] | 0);
      tick++;
    }
  };
});
