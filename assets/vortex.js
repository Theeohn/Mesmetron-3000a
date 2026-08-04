// MESMETRON screensaver module: "vortex"
// A hypnotic multi-layered geometric vortex that pulses and twists.
// Built following the module contract and erase-then-redraw pattern 
// demonstrated in kaleidoscope.js and ribbon.js[cite: 4, 5].

(function() {
  const CX = 240, CY = 160;
  const RINGS = 6;
  const SIDES = 5;
  let variant = 0, tick = 0;

  const prevX = Array.from({length: RINGS}, () => new Float32Array(SIDES));
  const prevY = Array.from({length: RINGS}, () => new Float32Array(SIDES));
  const hasDrawn = new Int8Array(RINGS);

  function drawPolygon(h, ring, xArr, yArr) { "ram";
    for (let i = 0; i < SIDES; i++) {
      const next = (i + 1) % SIDES;
      h.drawLine(xArr[i] | 0, yArr[i] | 0, xArr[next] | 0, yArr[next] | 0);
    }
  }

  return {
    init: function(v) {
      variant = v;
      tick = 0;
      hasDrawn.fill(0);
    },
    draw: function(h) { "ram";
      const spd = 0.02 + variant * 0.01;
      const t = tick * spd;

      // Erase previous frame polygons
      h.setColor(0);
      for (let r = 0; r < RINGS; r++) {
        if (hasDrawn[r]) {
          drawPolygon(h, r, prevX[r], prevY[r]);
        }
      }

      // Draw current frame polygons
      h.setColor(3);
      for (let r = 0; r < RINGS; r++) {
        const radius = (r + 1) * 22 + 15 * Math.sin(t * 0.5 + r * 0.4);
        const rot = t * (r % 2 === 0 ? 1 : -1) * (1 + r * 0.2);
        
        const curX = new Float32Array(SIDES);
        const curY = new Float32Array(SIDES);

        for (let i = 0; i < SIDES; i++) {
          const ang = rot + (i * 2 * Math.PI / SIDES);
          curX[i] = CX + radius * Math.cos(ang);
          curY[i] = CY + radius * Math.sin(ang) * 0.75;
        }

        drawPolygon(h, r, curX, curY);

        for (let i = 0; i < SIDES; i++) {
          prevX[r][i] = curX[i];
          prevY[r][i] = curY[i];
        }
        hasDrawn[r] = 1;
      }

      tick++;
    }
  };
});