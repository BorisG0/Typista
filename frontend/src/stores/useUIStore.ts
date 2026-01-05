import { create } from 'zustand'
import { LINE_LIMIT_MAX, LINE_LIMIT_MIN, LINE_LIMIT_STEP } from '../utils/typing'

type UIState = {
  lineLimit: number
  increaseLineLimit: () => void
  decreaseLineLimit: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  lineLimit: 48,

  increaseLineLimit: () => {
    const { lineLimit } = get()
    if (lineLimit < LINE_LIMIT_MAX) {
      set({ lineLimit: Math.min(LINE_LIMIT_MAX, lineLimit + LINE_LIMIT_STEP) })
    }
  },

  decreaseLineLimit: () => {
    const { lineLimit } = get()
    if (lineLimit > LINE_LIMIT_MIN) {
      set({ lineLimit: Math.max(LINE_LIMIT_MIN, lineLimit - LINE_LIMIT_STEP) })
    }
  },
}))

