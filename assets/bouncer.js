(function() {
  let variant = 0, tick = 0;
  let cx = 240, cy = 160, vx = 0, vy = 0;
  let sprite = null, spriteW = 0, spriteH = 0;
  // Declare clearance variables to track the necessary erase radius
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
      vx = 1.9; vy = 2.0;
      sprite = null;
      
      if (variant === 0) {
        spriteW = 180; spriteH = 40;
        clearHalfW = spriteW / 2; 
        clearHalfH = spriteH / 2;
        clockStr = Pip.currentDateTime()[0];
      } else {
        sprite = loadSprite(FILES[variant]);
        
        if (variant === 2) {
          // Calculate the max bounding radius (half-diagonal) for a rotating sprite
          let maxRad = Math.ceil(Math.sqrt((spriteW * spriteW) + (spriteH * spriteH)) / 2);
          clearHalfW = maxRad;
          clearHalfH = maxRad;
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