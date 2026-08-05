// MESMETRON screensaver module: "bouncer"
// A single bouncing element that ricochets off all four screen edges.
// See web.js for the module contract (init/draw) and file-wrapping convention.

(function() {
  let variant = 0, tick = 0;
  let cx = 240, cy = 160, vx = 0, vy = 0;
  let sprite = null, spriteW = 0, spriteH = 0;
  let clearHalfW = 0, clearHalfH = 0;
  let clockStr = "", clockTick = 0;
  const rotOpts = { rotate: 0 };

  const FILES = ["", "RC.JSON", "ROACH.JSON"];

  function loadSprite(filename) {
    const data = JSON.parse(require("fs").readFileSync("HOLO/MESMETRON/" + filename));
    spriteW = data.width;
    spriteH = data.height;
    const image = {
      bpp: data.bpp,
      buffer: E.toArrayBuffer(atob(data.buffer)),
      height: data.height,
      width: data.width
    };
    if (data.transparent >= 0) {
      image.transparent = data.transparent;
    }
    return image;
  }

  return {
    init: function(v) {
      variant = v;
      tick = 0;
      clockTick = 0;
      cx = 240; cy = 160;
      sprite = null;
      
      // Calculate a random trajectory using Math.randInt to adhere to Espruino constraints.
      // Keep generating until the angle is strictly NOT within 5 degrees of 
      // cardinals (0, 90, 180, 270) or diagonals (45, 135, 225, 315).
      let angleDeg, mod;
      do {
        angleDeg = Math.randInt(360);
        mod = angleDeg % 90;
      } while (mod <= 5 || mod >= 85 || (mod >= 40 && mod <= 50));
      
      // Maintain the original speed magnitude of ~2.76
      let angleRad = angleDeg * (Math.PI / 180);
      vx = 2.76 * Math.cos(angleRad);
      vy = 2.76 * Math.sin(angleRad);
      
      if (variant === 0) {
        clockStr = Pip.currentDateTime()[0];
        // Measure exact width using the selected font to eliminate the bumper
        spriteW = h.setFont("Monofonto36").stringWidth(clockStr); 
        spriteH = 36;
        clearHalfW = spriteW / 2; 
        clearHalfH = spriteH / 2;
      } else {
        sprite = loadSprite(FILES[variant]);
        
        if (variant === 2) {
          // Calculate the max bounding radius (half-diagonal) for a rotating sprite to prevent trails
          clearHalfW = clearHalfH = Math.ceil(Math.sqrt((spriteW * spriteW) + (spriteH * spriteH)) / 2);
        } else {
          // Non-rotating sprites just use their standard half-width/height
          clearHalfW = spriteW / 2; 
          clearHalfH = spriteH / 2;
        }
      }
      cx = E.clip(cx, spriteW / 2, 480 - spriteW / 2);
      cy = E.clip(cy, spriteH / 2, 320 - spriteH / 2);
    },
    draw: function(h) {  "ram";
      if (tick > 0) {
        // Use the pre-calculated clearance boundaries
        h.clearRect((cx - clearHalfW) | 0, (cy - clearHalfH) | 0,
          (cx + clearHalfW) | 0, (cy + clearHalfH) | 0);
      }

      cx += vx; cy += vy;
      if (cx < spriteW / 2 || cx > 480 - spriteW / 2) vx = -vx;
      if (cy < spriteH / 2 || cy > 320 - spriteH / 2) vy = -vy;
      cx = E.clip(cx, spriteW / 2, 480 - spriteW / 2);
      cy = E.clip(cy, spriteH / 2, 320 - spriteH / 2);

      if (variant === 0) {
        clockTick++;
        if (clockTick >= 25) {
          clockTick = 0;
          clockStr = Pip.currentDateTime()[0];
          // Update the width in case the time string length changed
          spriteW = h.setFont("Monofonto36").stringWidth(clockStr);
          clearHalfW = spriteW / 2;
        }
        h.setColor(3).setFont("Monofonto36").setFontAlign(0, 0);
        h.drawString(clockStr, cx | 0, cy | 0);
      } else if (variant === 2) {
        // Head (top of image) points along the direction of travel.
        rotOpts.rotate = Math.atan2(vy, vx) + 1.5707963267948966;
        h.setColor(3).drawImage(sprite, cx | 0, cy | 0, rotOpts);
      } else {
        h.drawImage(sprite, (cx - spriteW / 2) | 0, (cy - spriteH / 2) | 0);
      }
      tick++;
    }
  };
});