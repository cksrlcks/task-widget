export const TICKS = 30

/** 막대 위치(0~1) → 분(1~scaleMin) */
export const fracToMin = (frac: number, scaleMin: number) =>
  Math.min(scaleMin, Math.max(1, Math.round(frac * scaleMin)))

/**
 * 눈금 폭·간격(CSS px)을 실제 화면 픽셀 정수배로 맞춘다.
 * 칸 폭이 소수 픽셀이면 눈금마다 안티앨리어싱이 달라 굵기가 제각각으로 보인다
 */
export function snapTicks(widthPx: number, dpr: number, ticks = TICKS) {
  const slot = Math.max(2, Math.floor((widthPx * dpr) / ticks))
  const tick = Math.max(1, Math.round(slot * 0.55))
  return { tick: tick / dpr, gap: (slot - tick) / dpr }
}
