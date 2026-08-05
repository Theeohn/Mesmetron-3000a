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
//
// Background: MSMR.BIN is streamed straight into the frame buffer using the
// standard streaming-blit pattern (E.openFile + chunked reads into a
// Uint8Array view of h.buffer). This, plus the box border, is painted only
// ONCE per menu visit - from init(), not draw() - since neither ever changes
// while the menu is up. draw(h) is the cheap per-scroll redraw: it only
// clears and repaints the box's interior (the 3 visible rows + indicators),
// never the background or border, so scrolling doesn't re-stream the BIN or
// touch pixels outside the list. Looping menu audio (wild.wav) is app.js's
// responsibility to start/stop, since it has to persist across repeated
// visits to this screen and must not play during a screensaver - see app.js
// for that logic.

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
    { name: "KALEIDOSCOPE", file: "kaleidoscope.js" },
    { name: "MATRIX", file: "matrix.js" },
    { name: "RIBBON", file: "ribbon.js" },
    { name: "SHAPES", file: "shapes.js" },
    { name: "VORTEX", file: "vortex.js" },
    { name: "WARP", file: "warp.js" },
    { name: "WEB", file: "web.js" }
  ];
  const BX1 = 90, BY1 = 152, BX2 = 390, BY2 = 294;
  const ROWY0 = 185, ROWH = 38;
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
    h.setFont("Monofonto28").setFontAlign(0, 0);

    for (let i = 0; i < 3 && scroll + i < ITEMS.length; i++) {
      const idx = scroll + i;
      const cy = ROWY0 + i * ROWH;
      if (idx === selected) {
        h.setColor(3).fillRect(BX1 + 6, cy - 17, BX2 - 6, cy + 17);
        h.setColor(0).drawString(ITEMS[idx].name, 240, cy);
      } else {
        h.setColor(3).drawString(ITEMS[idx].name, 240, cy);
      }
    }

    // Scroll indicators (up/down filled triangles rendered using line loops)
    h.setColor(3);
    if (scroll > 0) {
      for (let py = 0; py <= 4; py++) {
        h.drawLine(100 - py, BY1 + 12 + py, 100 + py, BY1 + 12 + py);
        h.drawLine(380 - py, BY1 + 12 + py, 380 + py, BY1 + 12 + py);
      }
    }
    if (scroll + 3 < ITEMS.length) {
      for (let py = 0; py <= 4; py++) {
        h.drawLine(100 - py, BY2 - 12 - py, 100 + py, BY2 - 12 - py);
        h.drawLine(380 - py, BY2 - 12 - py, 380 + py, BY2 - 12 - py);
      }
    }
  }

  return {
    items: ITEMS,
    repaint: function() {
      drawBackground();
      drawBorder();
    },
    init: function(startIndex) {
      selected = E.clip(startIndex || 0, 0, ITEMS.length - 1);
      scroll = selected > 2 ? selected - 2 : 0;
      if (scroll > ITEMS.length - 3) scroll = Math.max(0, ITEMS.length - 3);
      this.repaint();
    },
    move: function(dir) {
      selected = E.clip(selected + dir, 0, ITEMS.length - 1);
      if (selected < scroll) {
        scroll = selected;
      } else if (selected >= scroll + 3) {
        scroll = selected - 2;
      }
      if (scroll > ITEMS.length - 3) scroll = Math.max(0, ITEMS.length - 3);
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