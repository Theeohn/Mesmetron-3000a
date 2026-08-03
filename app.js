(function() {
  const C = { CX: 240, CY: 160, N: 14, MODES: 6, VARIANTS: 3, FRAME_MS: 40, MCOLS: 30, MCHARS: 6 };
  // NOTE: tunnel mode has a known erase/redraw mismatch (recomputes the previous
  // frame's ring geometry from tick-1, which doesn't exactly cancel what was drawn).
  // This was found and understood, but is being left in deliberately: the leftover
  // trails it produces are a desired visual effect, not a bug to fix. Do not "fix" it.
  const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~";

  let mode = 0, variant = 0, tick = 0, running = 1;
  const ang = new Float32Array(C.N);
  const spd = new Float32Array(C.N);
  const px = new Float32Array(C.N);
  const py = new Float32Array(C.N);
  const dist = new Float32Array(C.N);
  const mHead = new Int16Array(C.MCOLS);
  const mSpd = new Uint8Array(C.MCOLS);
  const mColChars = new Uint8Array(C.MCOLS * C.MCHARS);
  let cellW = 12, cellH = 20, mCols = C.MCOLS, mRows = 16, mTrail = 8, mMid = 4, mWait = 60;

  for (let i = 0; i < C.N; i++) {
    ang[i] = Math.randInt(628) / 100;
    spd[i] = (Math.randInt(30) + 15) / 1000 * (i % 2 ? 1 : -1);
    dist[i] = Math.randInt(300);
  }

  function web(hh) {  "ram";
    const link = variant + 3;
    if (tick > 0) {
      hh.setColor(0);
      for (let i = 0; i < C.N; i++)
        hh.drawLine(px[i] | 0, py[i] | 0, px[(i + link) % C.N] | 0, py[(i + link) % C.N] | 0);
      hh.setColor(3);
    }
    const rx = 100 + 130 * Math.abs(Math.sin(tick / 41));
    const ry = 70 + 90 * Math.abs(Math.sin(tick / 53 + 1));
    for (let i = 0; i < C.N; i++) {
      ang[i] += spd[i] * (1 + variant * 0.5);
      px[i] = C.CX + rx * Math.cos(ang[i] * (1 + (i % 3) * 0.25));
      py[i] = C.CY + ry * Math.sin(ang[i] * (1 + (i % 4) * 0.18));
    }
    for (let i = 0; i < C.N; i++)
      hh.drawLine(px[i] | 0, py[i] | 0, px[(i + link) % C.N] | 0, py[(i + link) % C.N] | 0);
  }

  function ribbon(hh) {  "ram";
    const spdMul = 1 + variant * 0.6;
    const t = tick / 26 * spdMul;
    const freqA = 3.1 + variant * 0.4;
    const freqB = 2.3 + variant * 0.3;
    const nx = C.CX + 230 * Math.sin(freqA * t + Math.sin(t / 4.7));
    const ny = C.CY + 150 * Math.sin(freqB * t);
    if (tick > 10) {
      hh.setColor(0);
      hh.drawLineAA(px[3] | 0, py[3] | 0, px[2] | 0, py[2] | 0);
      hh.setColor(3);
    }
    px[3] = px[2]; py[3] = py[2];
    px[2] = px[1]; py[2] = py[1];
    px[1] = px[0]; py[1] = py[0];
    px[0] = nx; py[0] = ny;
    hh.drawLineAA(px[0] | 0, py[0] | 0, px[1] | 0, py[1] | 0);
  }

  function warp(hh) {  "ram";
    const step = 3 + variant * 3;
    for (let i = 0; i < C.N; i++) {
      const cs = Math.cos(ang[i]), sn = Math.sin(ang[i]);
      const d0 = dist[i];
      const d0tail = Math.max(d0 - (6 + d0 / 12), 0);
      if (tick > 0) {
        hh.setColor(0);
        hh.drawLine((C.CX + cs * d0) | 0, (C.CY + sn * d0) | 0,
          (C.CX + cs * d0tail) | 0, (C.CY + sn * d0tail) | 0);
        hh.setColor(3);
      }
      let d1 = d0 + step * (1 + d0 / 90);
      if (d1 > 340) { d1 = 4; ang[i] = Math.randInt(628) / 100; }
      dist[i] = d1;
      const cs1 = Math.cos(ang[i]), sn1 = Math.sin(ang[i]);
      const d1tail = Math.max(d1 - (6 + d1 / 12), 0);
      hh.drawLine((C.CX + cs1 * d1) | 0, (C.CY + sn1 * d1) | 0,
        (C.CX + cs1 * d1tail) | 0, (C.CY + sn1 * d1tail) | 0);
    }
  }

  function tunnel(hh) {  "ram";
    const sides = 5 + variant * 2;
    const rot = tick / 45;
    if (tick > 0) {
      hh.setColor(0);
      for (let r = 30; r < 340; r += 55) {
        const rr = r + 22 * Math.sin((tick - 1) / 18 + r);
        const pr = (tick - 1) / 30 + r * 0.01;
        for (let i = 0; i < sides; i++) {
          const a0 = pr + i * 6.283 / sides, a1 = pr + (i + 1) * 6.283 / sides;
          hh.drawLine((C.CX + rr * Math.cos(a0)) | 0, (C.CY + rr * 0.75 * Math.sin(a0)) | 0,
            (C.CX + rr * Math.cos(a1)) | 0, (C.CY + rr * 0.75 * Math.sin(a1)) | 0);
        }
      }
      hh.setColor(3);
    }
    for (let r = 30; r < 340; r += 55) {
      const rr = r + 22 * Math.sin(tick / 18 + r);
      const pr = rot + r * 0.01;
      for (let i = 0; i < sides; i++) {
        const a0 = pr + i * 6.283 / sides, a1 = pr + (i + 1) * 6.283 / sides;
        hh.drawLine((C.CX + rr * Math.cos(a0)) | 0, (C.CY + rr * 0.75 * Math.sin(a0)) | 0,
          (C.CX + rr * Math.cos(a1)) | 0, (C.CY + rr * 0.75 * Math.sin(a1)) | 0);
      }
    }
  }

  function bouncer(hh) {  "ram";
    const sides = 3 + variant;
    const spdMul = 1 + variant * 0.4;
    if (tick === 0) { px[0] = 240; py[0] = 160; ang[0] = 1.3 * spdMul; ang[1] = 1.7 * spdMul; ang[2] = 0; }
    const size = 55;
    if (tick > 0) {
      hh.setColor(0);
      for (let i = 0; i < sides; i++) {
        const a0 = ang[2] + i * 6.283 / sides, a1 = ang[2] + (i + 1) * 6.283 / sides;
        hh.drawLine((px[0] + size * Math.cos(a0)) | 0, (py[0] + size * Math.sin(a0)) | 0,
          (px[0] + size * Math.cos(a1)) | 0, (py[0] + size * Math.sin(a1)) | 0);
      }
      hh.setColor(3);
    }
    px[0] += ang[0]; py[0] += ang[1]; ang[2] += 0.05 * spdMul;
    if (px[0] < size || px[0] > 480 - size) ang[0] = -ang[0];
    if (py[0] < size || py[0] > 320 - size) ang[1] = -ang[1];
    px[0] = E.clip(px[0], size, 480 - size);
    py[0] = E.clip(py[0], size, 320 - size);
    for (let i = 0; i < sides; i++) {
      const a0 = ang[2] + i * 6.283 / sides, a1 = ang[2] + (i + 1) * 6.283 / sides;
      hh.drawLine((px[0] + size * Math.cos(a0)) | 0, (py[0] + size * Math.sin(a0)) | 0,
        (px[0] + size * Math.cos(a1)) | 0, (py[0] + size * Math.sin(a1)) | 0);
    }
  }

  function mChar(col, row) {  "ram";
    const k = ((row % C.MCHARS) + C.MCHARS) % C.MCHARS;
    return CHARSET.charAt(mColChars[col * C.MCHARS + k]);
  }

  function reseedCol(c) {  "ram";
    for (let k = 0; k < C.MCHARS; k++) mColChars[c * C.MCHARS + k] = Math.randInt(CHARSET.length);
  }

  function matrix(hh) {  "ram";
    if (tick === 0) {
      const m = hh.setFont("Monofonto18").stringMetrics("A");
      const naturalW = m.width + 3;
      cellH = m.height + 3;
      mCols = Math.min(Math.ceil(480 / naturalW), C.MCOLS);
      cellW = 480 / mCols;
      mRows = (320 / cellH) | 0;
      mTrail = 8 + variant * 4;
      mMid = Math.ceil(mTrail / 2);
      mWait = mRows * 3 + 15;
      for (let c = 0; c < mCols; c++) {
        mHead[c] = -Math.randInt(mWait);
        mSpd[c] = 1 + Math.randInt(1 + variant);
        reseedCol(c);
      }
    }
    hh.setFont("Monofonto18").setFontAlign(-1, -1);
    for (let c = 0; c < mCols; c++) {
      const x = (c * cellW) | 0;
      const xRight = (c === mCols - 1) ? 480 : ((c + 1) * cellW) | 0;
      const prevHead = mHead[c];
      const step = mSpd[c];
      if (prevHead >= 0 && prevHead < mRows)
        hh.setColor(2).drawString(mChar(c, prevHead), x, prevHead * cellH);
      const dim1Row = prevHead - mMid * step;
      if (dim1Row >= 0 && dim1Row < mRows)
        hh.setColor(1).drawString(mChar(c, dim1Row), x, dim1Row * cellH);
      const eraseRow = prevHead - mTrail * step;
      if (eraseRow >= 0 && eraseRow < mRows)
        hh.setColor(0).fillRect(x, eraseRow * cellH, xRight, eraseRow * cellH + cellH);
      mHead[c] += step;
      if (mHead[c] - mTrail * step > mRows) {
        mHead[c] = -Math.randInt(mWait);
        mSpd[c] = 1 + Math.randInt(1 + variant);
        reseedCol(c);
      }
      const hr = mHead[c];
      if (hr >= 0 && hr < mRows) hh.setColor(3).drawString(mChar(c, hr), x, hr * cellH);
    }
  }

  function onFrame(hh) {  "ram";
    if (!running) return;
    hh.setColor(3);
    if (mode === 0) web(hh);
    else if (mode === 1) ribbon(hh);
    else if (mode === 2) warp(hh);
    else if (mode === 3) tunnel(hh);
    else if (mode === 4) bouncer(hh);
    else matrix(hh);
    tick++;
    hh.flip();
    Pip.lastFlip = getTime();
  }

  function resetState() {
    h.clear(); tick = 0;
    for (let i = 0; i < C.N; i++) dist[i] = Math.randInt(300);
  }

  function onKnob1(dir) {
    if (dir) {
      mode = (mode + dir + C.MODES) % C.MODES;
      resetState();
      Pip.playSound("SCROLL");
    } else {
      running = running ? 0 : 1;
      Pip.playSound("TAB");
    }
  }

  function onKnob2(dir) {
    if (dir) {
      variant = (variant + dir + C.VARIANTS) % C.VARIANTS;
      resetState();
      Pip.playSound("HIGHLIGHT");
    } else {
      h.clear();
      Pip.playSound("SELECT");
    }
  }

  Pip.onExclusive("knob1", onKnob1);
  Pip.onExclusive("knob2", onKnob2);
  h.clear();
  const frameInterval = setInterval(onFrame, C.FRAME_MS, h);

  return {
    id: "MESMETRON",
    notDefault: true,
    fullscreen: true,
    remove: function() {
      clearInterval(frameInterval);
      Pip.removeListener("knob1", onKnob1);
      Pip.removeListener("knob2", onKnob2);
      h.clear();
    }
  };
});