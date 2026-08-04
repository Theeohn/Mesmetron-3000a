// MESMETRON screensaver module: "kaleidoscope"

(function() {
  const N = 12, CX = 240, CY = 160;
  let variant = 0, tick = 0;
  const ang = new Float32Array(N);
  const spd = new Float32Array(N);
  const px = new Float32Array(N);
  const py = new Float32Array(N);

  function drawSpokes(h, x, y) {  "ram";
    const dx = x - CX, dy = y - CY;
    h.drawLine(CX, CY, CX + dx, CY + dy);
    h.drawLine(CX, CY, CX - dx, CY + dy);
    h.drawLine(CX, CY, CX + dx, CY - dy);
    h.drawLine(CX, CY, CX - dx, CY - dy);
  }

  return {
    init: function(v) {
      variant = v;
      tick = 0;
      for (let i = 0; i < N; i++) {
        ang[i] = Math.randInt(628) / 100;
        spd[i] = (Math.randInt(20) + 10) / 1000 * (i % 2 ? 1 : -1);
      }
    },
    draw: function(h) {  "ram";
      h.setColor(3);
      if (tick > 0) {
        h.setColor(0);
        for (let i = 0; i < N; i++) drawSpokes(h, px[i] | 0, py[i] | 0);
        h.setColor(3);
      }
      
      const r = 50 + 200 * Math.abs(Math.sin(tick / (40 - variant * 6)));
      
      for (let i = 0; i < N; i++) {
        ang[i] += spd[i] * (1 + variant * 0.7);
        px[i] = CX + r * Math.cos(ang[i] * (1 + (i % 3) * 0.2));
        py[i] = CY + r * Math.sin(ang[i] * (1 + (i % 2) * 0.3)); // Removed the 0.7 vertical squash factor
      }
      
      for (let i = 0; i < N; i++) drawSpokes(h, px[i] | 0, py[i] | 0);
      tick++;
    }
  };
});