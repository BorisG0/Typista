import { useEffect, useRef, useState } from 'react'

import Toolbar from './components/Toolbar'
import TypingCanvas from './components/TypingCanvas'
import { useWpm } from './hooks/useWpm'
import {
  DEFAULT_TEXT,
  LINE_LIMIT_MAX,
  LINE_LIMIT_MIN,
  LINE_LIMIT_STEP,
  normalizePrompt,
} from './utils/typing'

const formatWpmValue = (value: number | null) =>
  value == null ? '--' : Math.max(0, Math.round(value)).toString()

const App = () => {
  const [targetText, setTargetText] = useState(() => normalizePrompt(DEFAULT_TEXT))
  const [typedText, setTypedText] = useState('')
  const [lineLimit, setLineLimit] = useState(48)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const charactersTyped = typedText.length
  const isComplete = targetText.length > 0 && typedText === targetText

  const { liveWpm, finalWpm, typingStarted, reset: resetWpm } = useWpm(charactersTyped, isComplete)

  useEffect(() => {
    if (charactersTyped === 0) {
      resetWpm()
    }
  }, [charactersTyped, resetWpm])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        setTypedText('')
        resetWpm()
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        setTypedText((previous) => previous.slice(0, -1))
        return
      }

      if (event.key.length === 1) {
        event.preventDefault()
        setTypedText((previous) => {
          if (previous.length >= targetText.length) return previous
          return `${previous}${event.key}`
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetWpm, targetText])

  const handleRestart = () => {
    setTypedText('')
    resetWpm()
    inputRef.current?.focus()
  }

  const handleCustomText = () => {
    const response = window.prompt('Paste the text you would like to practice:')
    if (response == null) {
      return
    }

    const normalized = normalizePrompt(response)
    if (normalized.length === 0) {
      return
    }

    setTargetText(normalized)
    setTypedText('')
    resetWpm()
    inputRef.current?.focus()
  }

  const handleLineLimitChange = (delta: number) => {
    setLineLimit((previous) =>
      Math.min(LINE_LIMIT_MAX, Math.max(LINE_LIMIT_MIN, previous + delta)),
    )
    inputRef.current?.focus()
  }

  const decreaseLineWidth = () => handleLineLimitChange(-LINE_LIMIT_STEP)
  const increaseLineWidth = () => handleLineLimitChange(LINE_LIMIT_STEP)

  const showFinal = finalWpm != null
  const wpmLabel = showFinal
    ? formatWpmValue(finalWpm)
    : typingStarted
      ? formatWpmValue(liveWpm)
      : '--'

  const wpmStatus: 'idle' | 'live' | 'final' = showFinal
    ? 'final'
    : typingStarted
      ? 'live'
      : 'idle'

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <Toolbar
        lineLimit={lineLimit}
        canDecrease={lineLimit > LINE_LIMIT_MIN}
        canIncrease={lineLimit < LINE_LIMIT_MAX}
        onDecrease={decreaseLineWidth}
        onIncrease={increaseLineWidth}
        onRestart={handleRestart}
        onCustomText={handleCustomText}
        wpmLabel={wpmLabel}
        wpmStatus={wpmStatus}
      />

      <TypingCanvas
        targetText={targetText}
        typedText={typedText}
        caretIndex={charactersTyped}
        isComplete={isComplete}
        lineLimit={lineLimit}
        inputRef={inputRef}
      />

      <div className="flex h-12 items-center justify-center text-xs uppercase tracking-[0.3em] text-gray-600">
        {typedText.length} / {targetText.length} characters
      </div>
    </main>
  )
}

export default App
