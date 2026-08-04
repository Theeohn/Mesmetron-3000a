// MESMETRON screensaver module: "matrix"
// Code-rain columns with a fixed-cadence, neighbor-aware drop scheduler:
// exactly one new drop is released on a constant timer, and it's only placed
// in a column whose immediate left/right neighbors are currently empty - so
// drops never fall in two adjacent columns at once, and the overall rate
// never drifts. See web.js for the module contract (init/draw) and the
// file-wrapping convention.
//
// Note: unlike the other modules, this one needs the graphics handle to
// measure font metrics before it can lay out columns. Since init(variant)
// doesn't receive the handle, that one-time setup is deferred to the first
// draw(h) call instead (guarded by needsSetup), the same way the original
// single-file version deferred it to its first tick===0 frame.

(function() {
  const MCOLS = 30, MCHARS = 6, RAIN_EVERY = 2;
  const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~";

  let variant = 0, needsSetup = 1;
  const mHead = new Int16Array(MCOLS);
  const mSpd = new Uint8Array(MCOLS);
  const mColChars = new Uint8Array(MCOLS * MCHARS);
  let cellW = 12, cellH = 20, mCols = MCOLS, mRows = 16, mTrail = 8, mMid = 4;
  let mSchedTimer = RAIN_EVERY;

  function mChar(col, row) {  "ram";
    const k = ((row % MCHARS) + MCHARS) % MCHARS;
    return CHARSET.charAt(mColChars[col * MCHARS + k]);
  }

  function reseedCol(c) {  "ram";
    for (let k = 0; k < MCHARS; k++) mColChars[c * MCHARS + k] = Math.randInt(CHARSET.length);
  }

  function tryActivate(randomStart) {  "ram";
    const start = Math.randInt(mCols);
    let attempts = 0;
    while (attempts < mCols) {
      const c = (start + attempts) % mCols;
      attempts++;
      const leftOk = (c === 0) || (mHead[c - 1] < 0);
      const rightOk = (c === mCols - 1) || (mHead[c + 1] < 0);
      if (mHead[c] < 0 && leftOk && rightOk) {
        mSpd[c] = 1 + Math.randInt(1 + variant);
        mHead[c] = randomStart ? Math.randInt(mRows + mTrail * mSpd[c]) : 0;
        reseedCol(c);
        return;
      }
    }
  }

  return {
    init: function(v) {
      variant = v;
      needsSetup = 1;
    },
    draw: function(h) {  "ram";
      if (needsSetup) {
        const m = h.setFont("Monofonto18").stringMetrics("A");
        const naturalW = m.width + 3;
        cellH = m.height + 3;
        mCols = Math.min(Math.ceil(480 / naturalW), MCOLS);
        cellW = 480 / mCols;
        mRows = (320 / cellH) | 0;
        mTrail = 8 + variant * 4;
        mMid = Math.ceil(mTrail / 2);
        mSchedTimer = RAIN_EVERY;
        for (let c = 0; c < mCols; c++) mHead[c] = -1;
        for (let i = 0; i < 8; i++) tryActivate(true);
        needsSetup = 0;
      }
      mSchedTimer--;
      if (mSchedTimer <= 0) {
        tryActivate();
        mSchedTimer = RAIN_EVERY;
      }
      h.setFont("Monofonto18").setFontAlign(-1, -1);
      for (let c = 0; c < mCols; c++) {
        if (mHead[c] < 0) continue;
        const x = (c * cellW) | 0;
        const xRight = (c === mCols - 1) ? 480 : ((c + 1) * cellW) | 0;
        const prevHead = mHead[c];
        const step = mSpd[c];
        if (prevHead >= 0 && prevHead < mRows)
          h.setColor(2).drawString(mChar(c, prevHead), x, prevHead * cellH);
        const dim1Row = prevHead - mMid * step;
        if (dim1Row >= 0 && dim1Row < mRows)
          h.setColor(1).drawString(mChar(c, dim1Row), x, dim1Row * cellH);
        const eraseRow = prevHead - mTrail * step;
        if (eraseRow >= 0 && eraseRow < mRows)
          h.setColor(0).fillRect(x, eraseRow * cellH, xRight, eraseRow * cellH + cellH);
        mHead[c] += step;
        if (mHead[c] - mTrail * step > mRows) {
          mHead[c] = -1;
        }
        const hr = mHead[c];
        if (hr >= 0 && hr < mRows) h.setColor(3).drawString(mChar(c, hr), x, hr * cellH);
      }
    }
  };
});