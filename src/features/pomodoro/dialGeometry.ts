export const C = 110 // 중심
export const R = 76 // 고리 반지름
export const SEGS = 60

/** 위(12시)에서 시계 방향 각도(도) → 좌표 */
export const at = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return [C + r * Math.sin(a), C - r * Math.cos(a)] as const
}
export const arc = (r: number, from: number, to: number) => {
  const [x1, y1] = at(r, from)
  const [x2, y2] = at(r, to)
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}
