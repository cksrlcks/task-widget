export const TICKS = 60

/** 막대 위치(0~1) → 분(1~scaleMin) */
export const fracToMin = (frac: number, scaleMin: number) =>
  Math.min(scaleMin, Math.max(1, Math.round(frac * scaleMin)))
