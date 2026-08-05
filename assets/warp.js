// MESMETRON screensaver module: "warp"
// A radiating starfield with filled circles zooming past,
// increasing in size across 10 distance rings.
// Tuned for a higher average on-screen count while preventing waves of 3+.
// See web.js for the module contract (init/draw) and file-wrapping convention.

(function() {
  const N = 23, CX = 240, CY = 160;
  let variant = 0, tick = 0, spawnCooldown = 0, quickSpawns = 0;
  const ang = new Float32Array(N);
  const dist = new Float32Array(N);

  return {
    init: function(v) {
      variant = v;
      tick = 0;
      spawnCooldown = 0;
      quickSpawns = 0;
      // Initialize all stars as inactive (-1) to start with a blank screen
      for (let i = 0; i < N; i++) {
        dist[i] = -1;
      }
    },
    draw: function(h) {  "ram";
      const step = 3 + variant * 3;
      
      // Spawning logic: only spawn one star at a time when cooldown allows
      if (spawnCooldown > 0) {
        spawnCooldown--;
      } else {
        for (let i = 0; i < N; i++) {
          if (dist[i] < 0) {
            dist[i] = 4;
            ang[i] = Math.randInt(628) / 100;
            
            // Allow a max of 1 quick follow-up to prevent waves of 3+
            // Increased chance to 50% for a quick pair, with a much shorter delay
            if (quickSpawns < 1 && Math.randInt(2) === 0) {
              spawnCooldown = Math.randInt(2); // 0-1 frames wait
              quickSpawns++;
            } else {
              spawnCooldown = Math.randInt(3) + 2; // 2-4 frames wait for normal pacing
              quickSpawns = 0;
            }
            break; // Only spawn one per frame
          }
        }
      }

      // Update and draw active stars
      for (let i = 0; i < N; i++) {
        const d0 = dist[i];
        if (d0 < 0) continue; // Skip inactive stars entirely for performance
        
        // Cache the angle calculation since it doesn't change during the star's lifetime
        const cs = Math.cos(ang[i]), sn = Math.sin(ang[i]);
        
        // Clear previous position (skip if it just spawned this frame)
        if (tick > 0 && d0 > 4) {
          h.setColor(0);
          let rx0 = (CX + cs * d0) | 0, ry0 = (CY + sn * d0) | 0;
          let ring0 = (d0 / 30) | 0;
          if (ring0 > 9) ring0 = 9;
          
          if (ring0 === 0) {
            // Clear a slightly larger area to prevent ghosting
            h.fillRect(rx0 - 2, ry0 - 2, rx0 + 1, ry0 + 1);
          } else {
            let rad0 = 1 + ((ring0 - 1) / 3) | 0;
            h.fillCircle(rx0, ry0, rad0 + 1);
          }
          h.setColor(3);
        }
        
        // Update distance
        let d1 = d0 + step * (1 + d0 / 90);
        
        // If it goes offscreen, kill it and free it up for the spawner
        if (d1 > 300) { 
          dist[i] = -1; 
          continue; 
        }
        
        dist[i] = d1;
        
        // Draw new position
        let rx1 = (CX + cs * d1) | 0, ry1 = (CY + sn * d1) | 0;
        let ring1 = (d1 / 30) | 0;
        if (ring1 > 9) ring1 = 9;
        
        if (ring1 === 0) {
          // 4px dot (2x2 square)
          h.fillRect(rx1 - 1, ry1 - 1, rx1, ry1);
        } else {
          // Slowly growing circles for rings 1-9
          let rad1 = 1 + ((ring1 - 1) / 3) | 0;
          h.fillCircle(rx1, ry1, rad1);
        }
      }
      tick++;
    }
  };
});