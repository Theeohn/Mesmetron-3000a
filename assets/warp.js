// MESMETRON screensaver module: "warp"
// A radiating starfield with filled circles zooming past,
// increasing in size across 10 distance rings.
// Tuned for a higher average on-screen count while preventing waves of 3+.
// See web.js for the module contract (init/draw) and file-wrapping convention.

(function() {
  const MAX_N = 26, CX = 240, CY = 160;
  const STAR_COUNTS = [17, 23, 26]; // Max stars for variants 0, 1, 2
  const MIN_ACTIVE = [11, 17, 20];  // Max minus 6 to keep the minimum shown count high
  let variant = 0, tick = 0, spawnCooldown = 0, quickSpawns = 0;
  const ang = new Float32Array(MAX_N);
  const dist = new Float32Array(MAX_N);

  return {
    init: function(v) {
      variant = v;
      tick = 0;
      spawnCooldown = 0;
      quickSpawns = 0;
      const currentN = STAR_COUNTS[variant];
      const minActive = MIN_ACTIVE[variant];
      
      // Initialize all stars as inactive (-1) first
      for (let i = 0; i < MAX_N; i++) {
        dist[i] = -1;
      }
      
      // Pre-seed up to the minimum required active count so it never starts sparse
      for (let i = 0; i < minActive; i++) {
        dist[i] = Math.randInt(250) + 10; // Spread them across various initial depths
        ang[i] = Math.randInt(628) / 100;
      }
    },
    draw: function(h) {  "ram";
      // Shifted speeds: 6 (new slow), 9 (new medium), 12 (new fast)
      const step = 6 + variant * 3;
      const currentN = STAR_COUNTS[variant];
      const minActive = MIN_ACTIVE[variant];
      
      // Count currently active stars
      let activeCount = 0;
      for (let i = 0; i < currentN; i++) {
        if (dist[i] >= 0) activeCount++;
      }

      // Spawning logic: spawn eagerly if we are below our forced minimum, or use cooldown if at/above it
      if (activeCount < minActive) {
        spawnCooldown = 0; // Force immediate spawning until we meet the minimum baseline
      }

      if (spawnCooldown > 0) {
        spawnCooldown--;
      } else {
        for (let i = 0; i < currentN; i++) {
          if (dist[i] < 0) {
            dist[i] = 4;
            ang[i] = Math.randInt(628) / 100;
            
            // Allow a max of 1 quick follow-up to prevent waves of 3+
            // Increased chance to 50% for a quick pair, with a much shorter delay
            if (activeCount >= minActive && quickSpawns < 1 && Math.randInt(2) === 0) {
              spawnCooldown = Math.randInt(2); // 0-1 frames wait
              quickSpawns++;
            } else {
              spawnCooldown = activeCount < minActive ? 0 : (Math.randInt(3) + 2); // Instant if below minimum, else 2-4 frames
              quickSpawns = 0;
            }
            break; // Only spawn one per frame
          }
        }
      }

      // Update and draw active stars
      for (let i = 0; i < currentN; i++) {
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