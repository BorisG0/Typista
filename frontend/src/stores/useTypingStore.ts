import { create } from 'zustand'
import type { TypingNode } from '../utils/typing'
import { BRANCHING_ROOT, createSuccessorPreview, normalizePrompt } from '../utils/typing'
import { generateText } from '../api/generate'

const FREESTYLE_PREVIEW = 'free '

type TypingState = {
  // Core typing state
  currentNode: TypingNode
  typedText: string
  choiceBuffer: string
  totalTyped: number
  typingState: 'initial' | 'typing' | 'choosing'

  // Freestyle mode
  freestyleMode: boolean
  freestyleInput: string
  isGenerating: boolean

  // WPM tracking
  startTimestamp: number | null
  pauseStartTime: number | null
  totalPausedTime: number
  liveWpm: number
  finalWpm: number | null

  // Actions
  typeCharacter: (char: string) => void
  backspace: () => void
  selectChoice: (preview: string) => void
  enterFreestyleMode: () => void
  updateFreestyleInput: (input: string) => void
  generateFromPrompt: (prompt: string) => Promise<void>
  restart: () => void
  setCustomText: (text: string) => void
  resetWpm: () => void
  updateWpm: () => void
}

const CHARACTERS_PER_WORD = 5

const computeWpm = (charactersTyped: number, elapsedMs: number) => {
  if (elapsedMs <= 0) return 0
  const minutes = elapsedMs / 60000
  const words = charactersTyped / CHARACTERS_PER_WORD
  const wpm = words / minutes
  if (!Number.isFinite(wpm) || wpm < 0) {
    return 0
  }
  return wpm
}

export const useTypingStore = create<TypingState>((set, get) => ({
  // Initial state
  currentNode: BRANCHING_ROOT,
  typedText: '',
  choiceBuffer: '',
  totalTyped: 0,
  typingState: 'initial',
  freestyleMode: false,
  freestyleInput: '',
  isGenerating: false,
  startTimestamp: null,
  pauseStartTime: null,
  totalPausedTime: 0,
  liveWpm: 0,
  finalWpm: null,

  // Actions
  typeCharacter: (char: string) => {
    const state = get()

    // Start WPM timer on first character
    if (state.totalTyped === 0 && state.startTimestamp === null) {
      set({ startTimestamp: Date.now(), typingState: 'typing' })
    }

    if (state.freestyleMode) {
      set({
        freestyleInput: state.freestyleInput + char,
        totalTyped: state.totalTyped + 1,
      })
      return
    }

    // Typing the main node text
    if (state.typedText.length < state.currentNode.text.length) {
      const newTypedText = state.typedText + char
      const isNodeComplete = newTypedText.length === state.currentNode.text.length
      set({
        typedText: newTypedText,
        totalTyped: state.totalTyped + 1,
        typingState: isNodeComplete ? 'choosing' : 'typing',
        pauseStartTime: isNodeComplete ? Date.now() : null,
      })
      return
    }

    // Node complete, typing choice buffer
    const nextBuffer = state.choiceBuffer + char
    set({
      choiceBuffer: nextBuffer,
      totalTyped: state.totalTyped + 1,
    })

    // Check for freestyle match
    if (nextBuffer === FREESTYLE_PREVIEW) {
      set({
        freestyleMode: true,
        choiceBuffer: '',
      })
      return
    }

    // Check for node choice match
    const matchedChoice = state.currentNode.successors.find(
      (node) => createSuccessorPreview(node.text) === nextBuffer
    )

    if (matchedChoice) {
      const pauseDuration = state.pauseStartTime != null ? Date.now() - state.pauseStartTime : 0
      set({
        currentNode: matchedChoice,
        typedText: nextBuffer,
        choiceBuffer: '',
        typingState: 'typing',
        pauseStartTime: null,
        totalPausedTime: state.totalPausedTime + pauseDuration,
      })
    }
  },

  backspace: () => {
    const state = get()

    if (state.freestyleMode) {
      if (state.freestyleInput.length > 0) {
        set({
          freestyleInput: state.freestyleInput.slice(0, -1),
          totalTyped: Math.max(0, state.totalTyped - 1),
        })
      } else {
        // Exit freestyle mode
        set({
          freestyleMode: false,
          choiceBuffer: FREESTYLE_PREVIEW.slice(0, -1),
        })
      }
      return
    }

    if (state.choiceBuffer.length > 0) {
      set({
        choiceBuffer: state.choiceBuffer.slice(0, -1),
        totalTyped: Math.max(0, state.totalTyped - 1),
      })
      return
    }

    if (state.typedText.length > 0) {
      set({
        typedText: state.typedText.slice(0, -1),
        totalTyped: Math.max(0, state.totalTyped - 1),
      })
    }
  },

  selectChoice: (preview: string) => {
    const state = get()
    const matchedNode = state.currentNode.successors.find(
      (node) => createSuccessorPreview(node.text) === preview
    )
    if (matchedNode) {
      set({
        currentNode: matchedNode,
        typedText: preview,
        choiceBuffer: '',
      })
    }
  },

  enterFreestyleMode: () => {
    set({
      freestyleMode: true,
      choiceBuffer: '',
    })
  },

  updateFreestyleInput: (input: string) => {
    set({ freestyleInput: input })
  },

  generateFromPrompt: async (prompt: string) => {
    const state = get()
    set({ isGenerating: true })
    try {
      const generatedText = await generateText(prompt)
      const normalized = normalizePrompt(generatedText)
      if (normalized.length > 0) {
        const pauseDuration = state.pauseStartTime != null ? Date.now() - state.pauseStartTime : 0
        const freestyleNode: TypingNode = {
          id: `freestyle-${Date.now()}`,
          text: normalized,
          successors: [],
        }
        set({
          currentNode: freestyleNode,
          typedText: '',
          choiceBuffer: '',
          freestyleMode: false,
          freestyleInput: '',
          typingState: 'typing',
          pauseStartTime: null,
          totalPausedTime: state.totalPausedTime + pauseDuration,
        })
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      set({ isGenerating: false })
    }
  },

  restart: () => {
    set({
      currentNode: BRANCHING_ROOT,
      typedText: '',
      choiceBuffer: '',
      totalTyped: 0,
      typingState: 'initial',
      freestyleMode: false,
      freestyleInput: '',
      startTimestamp: null,
      pauseStartTime: null,
      totalPausedTime: 0,
      liveWpm: 0,
      finalWpm: null,
    })
  },

  setCustomText: (text: string) => {
    const normalized = normalizePrompt(text)
    if (normalized.length === 0) {
      return
    }

    const customNode: TypingNode = {
      id: 'custom',
      text: normalized,
      successors: [],
    }

    set({
      currentNode: customNode,
      typedText: '',
      choiceBuffer: '',
      totalTyped: 0,
      typingState: 'initial',
      startTimestamp: null,
      pauseStartTime: null,
      totalPausedTime: 0,
      liveWpm: 0,
      finalWpm: null,
    })
  },

  resetWpm: () => {
    set({
      startTimestamp: null,
      liveWpm: 0,
      finalWpm: null,
    })
  },

  updateWpm: () => {
    const { totalTyped, startTimestamp, totalPausedTime } = get()
    if (startTimestamp == null || totalTyped <= 0) {
      return
    }
    const elapsedTime = Date.now() - startTimestamp - totalPausedTime
    const wpm = computeWpm(totalTyped, elapsedTime)
    set({ liveWpm: wpm })
  },
}))

