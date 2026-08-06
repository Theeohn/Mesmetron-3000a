// MESMETRON screensaver module: "matrix"
// Code-rain columns with autonomous, independent column spawning.

(function() {
  const MCOLS = 48, MCHARS = 6;
  const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~";

  let variant = 0, needsSetup = 1;
  const mHead = new Int16Array(MCOLS);
  const mSpd = new Uint8Array(MCOLS);
  const mColChars = new Uint8Array(MCOLS * MCHARS);
  let cellW = 20, stepW = 10, cellH = 26, mCols = MCOLS, mRows = 13, mTrail = 8, mMid = 4;

  function mChar(col, row) {  "ram";
    const k = ((row % MCHARS) + MCHARS) % MCHARS;
    return CHARSET.charAt(mColChars[col * MCHARS + k]);
  }

  function reseedCol(c) {  "ram";
    for (let k = 0; k < MCHARS; k++) mColChars[c * MCHARS + k] = Math.randInt(CHARSET.length);
  }

  return {
    init: function(v) {
      variant = v;
      needsSetup = 1;
    },
    draw: function(h) {  "ram";
      if (needsSetup) {
        const m = h.setFont("Monofonto23").stringMetrics("A");
        const naturalW = m.width + 3;
        cellH = m.height + 3;
        const baseCols = Math.min(Math.ceil(480 / naturalW), 24);
        mCols = Math.min(baseCols * 2, MCOLS);
        cellW = 480 / baseCols;
        stepW = cellW / 2;
        mRows = Math.ceil(320 / cellH);
        const baseSpd = variant === 0 ? 12 : (variant === 1 ? 9 : 6);
        mTrail = 8;
        mMid = 4;
        for (let c = 0; c < mCols; c++) {
          if (Math.randInt(4) === 0) {
            mSpd[c] = baseSpd;
            mHead[c] = Math.randInt((mRows + mTrail) * 12);
            reseedCol(c);
          } else {
            mHead[c] = -1;
          }
        }
        needsSetup = 0;
      }

      const baseSpd = variant === 0 ? 12 : (variant === 1 ? 9 : 6);
      h.setFont("Monofonto23").setFontAlign(-1, -1);
      for (let c = 0; c < mCols; c++) {
        if (mHead[c] < 0) {
          if (Math.randInt(30) === 0) {
            mSpd[c] = baseSpd;
            mHead[c] = 0;
            reseedCol(c);
          } else {
            continue;
          }
        }
        const x = (c * stepW) | 0;
        const xRight = Math.min(480, (x + cellW) | 0);
        const headVal = mHead[c];
        const step = mSpd[c];

        const eraseRow = ((headVal - (mTrail * 12)) / 12) | 0;
        if (eraseRow >= 0 && eraseRow < mRows)
          h.setColor(0).fillRect(x, eraseRow * cellH, xRight, eraseRow * cellH + cellH);

        const dimRow = ((headVal - (mMid * 12)) / 12) | 0;
        if (dimRow >= 0 && dimRow < mRows)
          h.setColor(1).drawString(mChar(c, dimRow), x, dimRow * cellH);

        const bodyRow = ((headVal - step) / 12) | 0;
        if (headVal >= step && bodyRow >= 0 && bodyRow < mRows)
          h.setColor(2).drawString(mChar(c, bodyRow), x, bodyRow * cellH);

        const hr = (headVal / 12) | 0;
        if (hr >= 0 && hr < mRows)
          h.setColor(3).drawString(mChar(c, hr), x, hr * cellH);

        mHead[c] += step;
        if (headVal - (mTrail * 12) > mRows * 12) {
          mHead[c] = -1;
        }
      }
    }
  };
});