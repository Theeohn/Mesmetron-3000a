// MESMETRON title/menu screen.
//
// A bordered, filled list box showing each screensaver name. Knob1 and knob2
// both scroll the selection; app.js decides what a press does (start the
// highlighted screensaver).
//
// This is the SINGLE list of available screensavers - app.js has no list of
// its own, it just reads .file off of whichever item is currently selected.
// That means adding a new screensaver only ever requires editing ONE file:
// this one. See the ITEMS array below.
//
// This module's contract is slightly different from a screensaver's, since
// it needs to expose selection state (and the item list itself) to the
// launcher:
//   init(startIndex) - reset to a given selected index (persists across visits)
//   move(dir)         - shift the selection by dir, clamping at ends
//   getSelected()     - returns the current selected index
//   items             - the ITEMS array itself, so app.js can read .file
//   draw(h)           - render the box interior only (see below)

(function() {
  // To add your own screensaver:
  //   1. Copy an existing module file (e.g. web.js) as a template, following
  //      its { init(variant), draw(h) } shape.
  //   2. Add one line below: { name: "YOUR NAME", file: "YOURFILE.JS" }.
  //      Order doesn't matter - insert it anywhere in the list.
  //   3. That's it. app.js will load "YOURFILE.JS" automatically once your
  //      entry is selected - nothing in app.js needs to change.
  // If the file named here doesn't actually exist on disk, app.js catches
  // that when you select it - it shows Pip's standard error box instead of
  // crashing, and drops you back at this menu so you can try something else.
  const ITEMS = [
    { name: "BOUNCER", file: "bouncer.js" },
    { name: "FIREWORKS", file: "fireworks.js" },
    { name: "KALEIDOSCOPE", file: "kaleidoscope.js" },
    { name: "MATRIX", file: "matrix.js" },
    { name: "RIBBON", file: "ribbon.js" },
    { name: "SPIRAL", file: "spiral.js" },
    { name: "SHAPES", file: "shapes.js" },
    { name: "VORTEX", file: "vortex.js" },
    { name: "WARP", file: "warp.js" },
    { name: "WEB", file: "web.js" },
    { name: "ZOOM", file: "zoom.js" }
  ];
  const BX1 = 90, BY1 = 152, BX2 = 390, BY2 = 294;
  const ROWY0 = 177, ROWH = 30;
  let selected = 0;
  let scroll = 0;

  function drawBackground() {
    let file = E.openFile('HOLO/MESMETRON/MSMR.BIN', 'r');
    let target = new Uint8Array(h.buffer);
    let offset = target.length;
    let chunk = file.read(256);
    while (chunk) {
      offset -= chunk.length;
      target.set(chunk, offset);
      chunk = file.read(256);
    }
    file.close();
  }

  function drawBorder() {
    h.setColor(3);
    h.drawRect(BX1, BY1, BX2, BY2);
    h.drawRect(BX1 + 1, BY1 + 1, BX2 - 1, BY2 - 1);
  }

  function drawList() {
    h.setColor(0).fillRect(BX1 + 2, BY1 + 2, BX2 - 2, BY2 - 2);
    h.setFont("Monofonto23").setFontAlign(0, 0);

    for (let i = 0; i < 4 && scroll + i < ITEMS.length; i++) {
      const idx = scroll + i;
      const cy = ROWY0 + i * ROWH;
      const isSelected = (idx === selected);

      if (isSelected) {
        h.setColor(3).fillRect(BX1 + 6, cy - 14, BX2 - 6, cy + 14);
        h.setColor(0).drawString(ITEMS[idx].name, 240, cy);
      } else {
        h.setColor(3).drawString(ITEMS[idx].name, 240, cy);
      }

      // In-line scroll indicators
      const leftX = BX1 + 24;
      const rightX = BX2 - 24;

      // Up indicator on the first visible row if we can scroll up
      if (i === 0 && scroll > 0) {
        h.setColor(isSelected ? 0 : 3);
        for (let dy = 0; dy < 15; dy++) {
          let w = (dy >> 1);
          let y = cy - 7 + dy;
          h.drawLine(leftX - w, y, leftX + w, y);
          h.drawLine(rightX - w, y, rightX + w, y);
        }
      }

      // Down indicator on the fourth visible row if we can scroll down
      if (i === 3 && scroll + 4 < ITEMS.length) {
        h.setColor(isSelected ? 0 : 3);
        for (let dy = 0; dy < 15; dy++) {
          let w = (dy >> 1);
          let y = cy + 7 - dy;
          h.drawLine(leftX - w, y, leftX + w, y);
          h.drawLine(rightX - w, y, rightX + w, y);
        }
      }
    }
  }

  return {
    id: "MESMETRON_MENU",
    remove: function() {},
    items: ITEMS,
    repaint: function() {
      drawBackground();
      drawBorder();
    },
    init: function(startIndex) {
      selected = E.clip(startIndex || 0, 0, ITEMS.length - 1);
      scroll = selected > 3 ? selected - 3 : 0;
      if (scroll > ITEMS.length - 4) scroll = Math.max(0, ITEMS.length - 4);
      this.repaint();
    },
    move: function(dir) {
      selected = E.clip(selected + dir, 0, ITEMS.length - 1);
      if (selected < scroll) {
        scroll = selected;
      } else if (selected >= scroll + 4) {
        scroll = selected - 3;
      }
      if (scroll > ITEMS.length - 4) scroll = Math.max(0, ITEMS.length - 4);
      if (scroll < 0) scroll = 0;
    },
    getSelected: function() {
      return selected;
    },
    draw: function(h) {  "ram";
      drawList();
    }
  };
});