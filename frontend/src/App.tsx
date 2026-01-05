import { useEffect } from 'react'

import Toolbar from './components/Toolbar'
import TypingCanvas from './components/TypingCanvas'
import { useTypingStore } from './stores/useTypingStore'

const formatWpmValue = (value: number | null) =>
  value == null ? '--' : Math.max(0, Math.round(value)).toString()

const App = () => {
  // Subscribe to typing store
  const currentNode = useTypingStore((state) => state.currentNode)
  const typedText = useTypingStore((state) => state.typedText)
  const totalTyped = useTypingStore((state) => state.totalTyped)
  const typingState = useTypingStore((state) => state.typingState)
  const freestyleMode = useTypingStore((state) => state.freestyleMode)
  const freestyleInput = useTypingStore((state) => state.freestyleInput)
  const isGenerating = useTypingStore((state) => state.isGenerating)
  const liveWpm = useTypingStore((state) => state.liveWpm)
  const finalWpm = useTypingStore((state) => state.finalWpm)
  const startTimestamp = useTypingStore((state) => state.startTimestamp)
  
  // Computed values
  const typingStarted = startTimestamp != null && totalTyped > 0

  // Actions
  const typeCharacter = useTypingStore((state) => state.typeCharacter)
  const backspace = useTypingStore((state) => state.backspace)
  const restart = useTypingStore((state) => state.restart)
  const setCustomText = useTypingStore((state) => state.setCustomText)
  const generateFromPrompt = useTypingStore((state) => state.generateFromPrompt)
  const updateWpm = useTypingStore((state) => state.updateWpm)

  // WPM update interval (only when actively typing)
  useEffect(() => {
    if (typingState !== 'typing' || finalWpm != null) {
      return
    }

    const intervalId = window.setInterval(updateWpm, 200)
    return () => window.clearInterval(intervalId)
  }, [typingState, finalWpm, updateWpm])

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isGenerating) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        restart()
        return
      }

      // Handle freestyle mode
      if (freestyleMode) {
        if (event.key === 'Enter') {
          event.preventDefault()
          if (freestyleInput.trim().length > 0) {
            generateFromPrompt(freestyleInput.trim())
          }
          return
        }

        if (event.key === 'Backspace') {
          event.preventDefault()
          backspace()
          return
        }

        if (event.key.length === 1) {
          event.preventDefault()
          typeCharacter(event.key)
        }
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        backspace()
        return
      }

      if (event.key.length === 1) {
        event.preventDefault()
        typeCharacter(event.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    freestyleMode,
    freestyleInput,
    isGenerating,
    typeCharacter,
    backspace,
    restart,
    generateFromPrompt,
  ])

  const handleCustomText = () => {
    const response = window.prompt('Paste the text you would like to practice:')
    if (response == null) {
      return
    }

    setCustomText(response)
  }

  const handleRestart = () => {
    restart()
  }

  const showFinal = finalWpm != null
  const wpmLabel = showFinal
    ? formatWpmValue(finalWpm)
    : typingStarted
      ? formatWpmValue(liveWpm)
      : '--'

  const wpmStatus: 'idle' | 'live' | 'final' = showFinal
    ? 'final'
    : typingState === 'typing'
      ? 'live'
      : 'idle'

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <Toolbar
        onRestart={handleRestart}
        onCustomText={handleCustomText}
        wpmLabel={wpmLabel}
        wpmStatus={wpmStatus}
        typingState={typingState}
      />

      <TypingCanvas />

      <div className="flex h-12 items-center justify-center text-xs uppercase tracking-[0.3em] text-gray-600">
        {typedText.length} / {currentNode.text.length} characters
      </div>
    </main>
  )
}

export default App
