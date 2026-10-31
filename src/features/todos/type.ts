export type Todo = {
  id: string
  title: string
  done: boolean
  /** 끌어서 정한 순서. 작을수록 위, 0이면 만든 순서 */
  position: number
  created: string
  updated: string
}
