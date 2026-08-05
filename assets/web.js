// MESMETRON screensaver module: "web"
// A rotating cross-linked lattice of nodes tracing pulsing elliptical orbits.

(function() {
  const N = 14, CX = 240, CY = 160;
  let variant = 0, lastVariant = 0, tick = 0;
  const ang = new Float32Array(N);
  const spd = new Float32Array(N);
  const px = new Float32Array(N);
  const py = new Float32Array(N);
  
  // Link offsets for variants 0, 1, and 2
  const LINKS = new Int8Array([3, 7, 5]);

  return {
    init: function(v) {
      variant = v;
      lastVariant = v;
      tick = 0;
      for (let i = 0; i < N; i++) {
        ang[i] = Math.randInt(628) / 100;
        spd[i] = (Math.randInt(30) + 15) / 1000 * (i % 2 ? 1 : -1);
      }
    },
    draw: function(h) {  "ram";
      const oldLink = LINKS[lastVariant];
      const newLink = LINKS[variant];

      h.setColor(3);
      if (tick > 0) {
        // Erase the old lines using the link configuration from the LAST frame
        h.setColor(0);
        for (let i = 0; i < N; i++) {
          h.drawLine(px[i] | 0, py[i] | 0, px[(i + oldLink) % N] | 0, py[(i + oldLink) % N] | 0);
        }
        h.setColor(3);
      }
      
      const rx = 100 + 130 * Math.abs(Math.sin(tick / 41));
      const ry = 70 + 90 * Math.abs(Math.sin(tick / 53 + 1));
      
      for (let i = 0; i < N; i++) {
        // Orbit speed is now locked to the lowest default value
        ang[i] += spd[i]; 
        
        if (variant === 0) {
          // V0: Chaotic atomic orbits
          px[i] = CX + rx * Math.cos(ang[i] * (1 + (i % 3) * 0.25));
          py[i] = CY + ry * Math.sin(ang[i] * (1 + (i % 4) * 0.18));
        } else if (variant === 1) {
          // V1: 3D twisting helix / data column
          px[i] = CX + rx * Math.cos(ang[i]);
          py[i] = CY + ry * Math.sin(ang[i] * 3);
        } else {
          // V2: Complex starburst / geometric reticle
          px[i] = CX + (rx * 0.8) * (Math.cos(ang[i]) + Math.cos(ang[i] * 4) * 0.4);
          py[i] = CY + (ry * 0.8) * (Math.sin(ang[i]) + Math.sin(ang[i] * 4) * 0.4);
        }
      }
      
      // Draw new lines using the current link configuration
      for (let i = 0; i < N; i++) {
        h.drawLine(px[i] | 0, py[i] | 0, px[(i + newLink) % N] | 0, py[(i + newLink) % N] | 0);
      }
        
      lastVariant = variant;
      tick++;
    }
  };
});