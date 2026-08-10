// MESMETRON screensaver module: "sand"
//
// Owns its own knob1 (rotate + short press) and knob2 (rotate + press)
// input while active; see web.js for the full module contract
// (init/draw/remove) and file-wrapping convention.

(function() {
  const hmap = new Uint16Array(480);

  let mode = 0;
  let active = false;
  let px = 0, py = 0, oldX = 0, oldY = 0;
  let state = 0; 
  let slideDir = 0;
  let m2Tick = 0;
  let brightnessStep = 20, lastKnob = 0;

  function spawn() {
    if (mode === 0) {
      px = Math.randInt(440) + 20;
    } else {
      px = 240;
    }
    py = 0;
    oldX = px;
    oldY = py;
    state = 1;
    active = true;
  }

  function physics() { "jit";
    if (!active) return;

    oldX = px;
    oldY = py;

    if (mode === 0) {
      // Slower, natural fall speed (6px/frame ensures a true ~1-second descent)
      py += 6;
      let ix = Math.floor(px);
      
      // True width footprint check (radius 2 -> checks x-2 to x+2)
      let groundY = 320;
      for (let x = ix - 2; x <= ix + 2; x++) {
        if (x >= 0 && x < 480 && hmap[x] < groundY) {
          groundY = hmap[x];
        }
      }

      if (py >= groundY - 2) {
        py = groundY - 2;
        
        // Avalanche / roll-off slope check across the neighboring width footprint
        let leftH = (ix >= 4) ? hmap[ix - 4] : 320;
        let rightH = (ix <= 476) ? hmap[ix + 4] : 320;

        if (leftH > hmap[ix] + 2 && leftH >= rightH) {
          px -= 2; // Roll left down the slope
        } else if (rightH > hmap[ix] + 2 && rightH > leftH) {
          px += 2; // Roll right down the slope
        } else {
          // Settle across the full 5-pixel width footprint so it stacks properly without sinking
          for (let x = ix - 2; x <= ix + 2; x++) {
            if (x >= 0 && x < 480) {
              hmap[x] = Math.min(hmap[x], py);
            }
          }
          active = false;
        }
      }
    } else if (mode === 1) {
      if (state === 1) {
        py += 6;
        let ix = Math.floor(px);

        if (px >= 180 && px <= 300) {
          let yEdge = (px <= 240) ? (-2 * px + 680) : (2 * px - 280);
          if (py >= yEdge - 2) {
            py = yEdge - 2;
            state = 2;
            slideDir = (px === 240) ? (Math.randInt(2) ? 2 : -2) : (px < 240 ? -2 : 2);
          }
        } else {
          let groundY = 320;
          for (let x = ix - 2; x <= ix + 2; x++) {
            if (x >= 0 && x < 480 && hmap[x] < groundY) groundY = hmap[x];
          }
          if (py >= groundY - 2) {
            py = groundY - 2;
            for (let x = ix - 2; x <= ix + 2; x++) {
              if (x >= 0 && x < 480) hmap[x] = Math.min(hmap[x], py);
            }
            active = false;
          }
        }
      } else if (state === 2) {
        px += slideDir;
        if (px >= 180 && px <= 300) {
          py = (px <= 240) ? (-2 * px + 680) : (2 * px - 280);
        } else {
          state = 1;
        }
      }
    } else if (mode === 2) {
      py += 6;
      let ix = Math.floor(px);

      let groundY = 320;
      for (let x = ix - 2; x <= ix + 2; x++) {
        if (x >= 230 && x <= 250 && hmap[x] < groundY) groundY = hmap[x];
      }

      if (py >= groundY - 2) {
        py = groundY - 2;
        let leftH = (ix > 230) ? hmap[ix - 2] : 320;
        let rightH = (ix < 250) ? hmap[ix + 2] : 320;

        if (leftH > hmap[ix] && leftH >= rightH && ix > 230) {
          px -= 1;
        } else if (rightH > hmap[ix] && rightH > leftH && ix < 250) {
          px += 1;
        } else {
          for (let x = ix - 2; x <= ix + 2; x++) {
            if (x >= 230 && x <= 250) hmap[x] = Math.min(hmap[x], py);
          }
          active = false;
        }
      }
    }
  }

  function setup(variant) {
    mode = variant;
    active = false;
    m2Tick = 0;
    for (let i = 0; i < 480; i++) hmap[i] = 320;
    h.clear();
    if (mode === 1) {
      h.setColor(3).fillPoly([180, 320, 240, 200, 300, 320]);
    } else if (mode === 2) {
      h.setColor(3)
       .drawLine(230, 280, 230, 320)
       .drawLine(250, 280, 250, 320)
       .drawLine(230, 320, 250, 320);
    }
  }

  function onKnob1(dir, long) {  "ram";
    if (dir) {
      const now = getTime();
      if (now - lastKnob < 0.03) return;
      lastKnob = now;
      brightnessStep = E.clip(brightnessStep + (dir > 0 ? -1 : 1), 1, 20);
      Pip.setBrightness(brightnessStep / 20.0);
      if (Pip.playSound) Pip.playSound("HIGHLIGHT");
    }
    // dir === 0 && !long -> short press, reserved for this module. A long
    // press is handled by the launcher, which returns to the menu.
  }

  function onKnob2(dir) {  "ram";
    if (dir) {
      mode = (mode + dir + 3) % 3;
      h.clear();
      setup(mode);
      Pip.playSound("HIGHLIGHT");
    } else {
      h.clear();
      Pip.playSound("SELECT");
    }
  }

  return {
    id: "SAND",
    init: function(variant) {
      setup(variant);
      Pip.on("knob1", onKnob1);
      Pip.on("knob2", onKnob2);
    },
    draw: function(h) { "ram";
      if (!active) {
        if (mode === 2) {
          m2Tick++;
          if (m2Tick > 400) {
            h.clearRect(225, 275, 255, 320);
            for (let i = 230; i <= 250; i++) hmap[i] = 320;
            h.setColor(3)
             .drawLine(230, 280, 230, 320)
             .drawLine(250, 280, 250, 320)
             .drawLine(230, 320, 250, 320);
            m2Tick = 0;
          }
        }
        spawn();
      }

      physics();

      if (oldX !== px || oldY !== py) {
        h.clearRect(oldX - 3, oldY - 3, oldX + 3, oldY + 3);
      }

      if (mode === 1) {
        h.setColor(3).fillPoly([180, 320, 240, 200, 300, 320]);
      } else if (mode === 2) {
        h.setColor(3)
         .drawLine(230, 280, 230, 320)
         .drawLine(250, 280, 250, 320)
         .drawLine(230, 320, 250, 320);
      }

      h.setColor(3).fillCircle(px, py, 2);
    },
    remove: function() {
      Pip.removeListener("knob1", onKnob1);
      Pip.removeListener("knob2", onKnob2);
    }
  };
});
