import { useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_TEXT =
  'Focus on accuracy first, speed follows when your fingers trust the keys.'

const LINE_LIMIT_MIN = 24
const LINE_LIMIT_MAX = 80
const LINE_LIMIT_STEP = 4

const normalizePrompt = (input: string) =>
  input
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim()

const App = () => {
  const [targetText, setTargetText] = useState(() => normalizePrompt(DEFAULT_TEXT))
  const [typedText, setTypedText] = useState('')
  const [lineLimit, setLineLimit] = useState(48)
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null)
  const [liveWpm, setLiveWpm] = useState(0)
  const [finalWpm, setFinalWpm] = useState<number | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        setTypedText('')
        setStartTimestamp(null)
        setLiveWpm(0)
        setFinalWpm(null)
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
          const nextValue = `${previous}${event.key}`
          if (previous.length === 0 && startTimestamp == null) {
            setStartTimestamp(Date.now())
          }
          return nextValue
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [targetText, startTimestamp])

  const characterStates = useMemo(() => {
    return targetText.split('').map((expectedChar, index) => {
      const currentChar = typedText[index]
      if (currentChar == null) return 'pending' as const
      return currentChar === expectedChar ? ('correct' as const) : ('incorrect' as const)
    })
  }, [typedText, targetText])

  const charactersTyped = typedText.length
  const isComplete = typedText === targetText
  const caretIndex = charactersTyped

  useEffect(() => {
    if (!startTimestamp || charactersTyped === 0) {
      setLiveWpm(0)
      return
    }

    const update = () => {
      const elapsedMs = Date.now() - startTimestamp
      if (elapsedMs <= 0) {
        setLiveWpm(0)
        return
      }
      const minutes = elapsedMs / 60000
      const words = charactersTyped / 5
      const wpm = words / minutes
      setLiveWpm(Number.isFinite(wpm) && wpm > 0 ? wpm : 0)
    }

    update()

    if (isComplete) {
      return
    }

    const interval = window.setInterval(update, 200)
    return () => window.clearInterval(interval)
  }, [startTimestamp, charactersTyped, isComplete])

  useEffect(() => {
    if (isComplete && startTimestamp) {
      const elapsedMs = Date.now() - startTimestamp
      if (elapsedMs > 0) {
        const minutes = elapsedMs / 60000
        const words = charactersTyped / 5
        const wpm = words / minutes
        const finalValue = Number.isFinite(wpm) && wpm > 0 ? wpm : 0
        setFinalWpm(finalValue)
        setLiveWpm(finalValue)
      }
    } else if (!isComplete) {
      setFinalWpm(null)
    }
  }, [isComplete, startTimestamp, charactersTyped])

  const renderedCharacters = useMemo(() => {
    const characters = targetText.split('').map((char, index) => {
      const state = characterStates[index]

      const styles =
        state === 'correct'
          ? 'text-white'
          : state === 'incorrect'
            ? 'text-red-500'
            : 'text-gray-500'

      const displayChar = char === ' ' ? ' ' : char

      return (
        <span key={`char-${index}`} className={`rounded px-0.5 transition-colors ${styles}`}>
          {displayChar}
        </span>
      )
    })

    if (!isComplete) {
      characters.splice(
        caretIndex,
        0,
        <span key="caret" className="caret-cursor" aria-hidden />,
      )
    }

    return characters
  }, [characterStates, caretIndex, isComplete, targetText])

  const handleRestart = () => {
    setTypedText('')
    setStartTimestamp(null)
    setLiveWpm(0)
    setFinalWpm(null)
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
    setStartTimestamp(null)
    setLiveWpm(0)
    setFinalWpm(null)
    inputRef.current?.focus()
  }

  const adjustLineLimit = (delta: number) => {
    setLineLimit((previous) =>
      Math.min(LINE_LIMIT_MAX, Math.max(LINE_LIMIT_MIN, previous + delta)),
    )
    inputRef.current?.focus()
  }

  const formatWpmValue = (value: number | null) => {
    if (value == null || !Number.isFinite(value)) {
      return '--'
    }
    return Math.max(0, Math.round(value)).toString()
  }

  const liveWpmDisplay = startTimestamp ? formatWpmValue(liveWpm) : '--'
  const finalWpmDisplay = formatWpmValue(finalWpm)

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex h-16 items-center gap-6 border-b border-white/10 bg-black/95 px-6 text-xs uppercase tracking-[0.3em]">
        <span className="text-gray-400">Typist</span>
        <div className="ml-auto flex items-center gap-6">
          <div className="flex items-center gap-3 text-[0.65rem] tracking-[0.2em] text-gray-500">
            <span>Line Width</span>
            <div className="flex items-center gap-1 rounded-full border border-white/15 px-2 py-1 text-white">
              <button
                type="button"
                className="rounded-full px-2 text-base text-gray-400 transition hover:text-white disabled:opacity-30"
                onClick={() => adjustLineLimit(-LINE_LIMIT_STEP)}
                disabled={lineLimit <= LINE_LIMIT_MIN}
                aria-label="Decrease line width"
              >
                &minus;
              </button>
              <span className="min-w-[3.5rem] text-center text-[0.65rem] tracking-[0.2em] text-white">
                {lineLimit}ch
              </span>
              <button
                type="button"
                className="rounded-full px-2 text-base text-gray-400 transition hover:text-white disabled:opacity-30"
                onClick={() => adjustLineLimit(LINE_LIMIT_STEP)}
                disabled={lineLimit >= LINE_LIMIT_MAX}
                aria-label="Increase line width"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[0.65rem] tracking-[0.2em] text-gray-500">
            <span className="flex items-center gap-2">
              <span>Live</span>
              <span className="text-white">{liveWpmDisplay}</span>
            </span>
            <span className="flex items-center gap-2">
              <span>Final</span>
              <span className="text-white">{finalWpmDisplay}</span>
            </span>
          </div>
          <div className="flex gap-3 text-[0.65rem] tracking-[0.25em]">
            <button
              type="button"
              className="rounded-full border border-white/20 px-4 py-1.5 text-white transition hover:bg-white/10"
              onClick={handleRestart}
            >
              Restart
            </button>
            <button
              type="button"
              className="rounded-full border border-white px-4 py-1.5 text-black transition hover:bg-white/80 hover:text-black bg-white/90"
              onClick={handleCustomText}
            >
              Custom Text
            </button>
          </div>
        </div>
      </header>

      <section
        className="flex flex-1 items-center justify-center px-8"
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        <div
          className="relative mx-auto text-2xl tracking-wide text-gray-500 leading-[1.6] break-words whitespace-pre-wrap"
          style={{ maxWidth: `${lineLimit}ch` }}
        >
          <textarea
            ref={inputRef}
            className="absolute h-0 w-0 opacity-0"
            value={typedText}
            readOnly
            aria-hidden
          />
          {renderedCharacters}
        </div>
      </section>

      <div className="flex h-12 items-center justify-center text-xs uppercase tracking-[0.3em] text-gray-600">
        {typedText.length} / {targetText.length} characters
      </div>
    </main>
  )
}

export default App
