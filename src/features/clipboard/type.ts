export type ClipItem = {
  id: string
  text: string
  /** 이미지 항목의 썸네일(data URL). Windows 기록만 */
  image?: string
  /** 고정하면 목록 위에 남고 "모두 지우기"·개수 제한에도 지워지지 않는다 */
  pinned: boolean
}

/** 섹션이 쓰는 기록. Windows는 시스템 기록(Win+V), 그 밖은 위젯이 직접 모은 기록 */
export type ClipList = {
  clips: ClipItem[]
  /** 기록을 못 읽을 때 안내 문구 */
  error?: string
  /** 고정은 직접 모은 기록만(Windows 기록 API는 고정 여부를 주지 않는다) */
  canPin: boolean
  copy: (c: ClipItem) => void
  remove: (c: ClipItem) => void
  togglePin: (c: ClipItem) => void
  clear: () => void
  /** "모두 지우기" 확인 문구 */
  clearNote: string
}
