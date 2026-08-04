(function() {
  // MESMETRON launcher.
  //
  // Each screensaver lives in its own file (web.js, ribbon.js, warp.js,
  // tunnel.js, bouncer.js, matrix.js) plus a menu screen (title.js). This
  // file loads them from disk on demand via eval(require("fs").readFileSync),
  // the documented pattern for external code files - there's no ES module
  // import/export in this environment. Only the currently active
  // screensaver's code is ever resident in memory; switching modes drops the
  // old one and loads the new one fresh.
  const BASE_PATH = "HOLO/MESMETRON/";
  const VARIANTS = 3;
  const FRAME_MS = 40;

  let mode = 0, variant = 0;
  let inMenu = 1, menuDirty = 1;
  let brightnessStep = 20; // 1 to 20 OS scale
  let lastKnob = 0;
  let currentModule = null, titleModule = null;

  function loadModule(filename) {
    return eval(require("fs").readFileSync(BASE_PATH + filename))();
  }

  Pip.setBrightness(brightnessStep / 20.0);

  function menuInput(dir) {
    if (dir) {
      titleModule.move(dir);
      menuDirty = 1;
      Pip.playSound("SCROLL");
    } else {
      const idx = titleModule.getSelected();
      try {
        const mod = loadModule(titleModule.items[idx].file);
        mod.init(variant);
        mode = idx;
        currentModule = mod;
        inMenu = 0;
        h.clear();
        Pip.playSound("SELECT");
      } catch (err) {
        Pip.errorBox(err);
        menuDirty = 1;
      }
    }
  }

  function onKnob1(dir, long) {  "ram";
    if (inMenu) { menuInput(dir); return; }
    if (dir) {
      let now = getTime();
      if (now - lastKnob < 0.03) return;
      lastKnob = now;
      brightnessStep = E.clip(brightnessStep + (dir > 0 ? -1 : 1), 1, 20);
      Pip.setBrightness(brightnessStep / 20.0);
      if (Pip.playSound) Pip.playSound("HIGHLIGHT");
    } else {
      currentModule = null;
      inMenu = 1;
      menuDirty = 1;
      Pip.playSound("TAB");
    }
  }

  function onKnob2(dir) {  "ram";
    if (inMenu) { menuInput(dir); return; }
    if (dir) {
      variant = (variant + dir + VARIANTS) % VARIANTS;
      h.clear();
      currentModule.init(variant);
      Pip.playSound("HIGHLIGHT");
    } else {
      h.clear();
      Pip.playSound("SELECT");
    }
  }

  function onFrame() {  "ram";
    if (inMenu) {
      if (menuDirty) {
        titleModule.draw(h);
        h.flip();
        Pip.lastFlip = getTime();
        menuDirty = 0;
      }
      return;
    }
    currentModule.draw(h);
    h.flip();
    Pip.lastFlip = getTime();
  }

  Pip.onExclusive("knob1", onKnob1);
  Pip.onExclusive("knob2", onKnob2);
  h.clear();
  titleModule = loadModule("TITLE.JS");
  titleModule.init(0);
  const frameInterval = setInterval(onFrame, FRAME_MS);

  return {
    id: "MESMETRON",
    notDefault: true,
    fullscreen: true,
    remove: function() {
      clearInterval(frameInterval);
      Pip.removeListener("knob1", onKnob1);
      Pip.removeListener("knob2", onKnob2);
      Pip.setBrightness(1.0);
      h.clear();
    }
  };
});