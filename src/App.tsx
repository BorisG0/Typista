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
  }, [targetText])

  const characterStates = useMemo(() => {
    return targetText.split('').map((expectedChar, index) => {
      const currentChar = typedText[index]
      if (currentChar == null) return 'pending' as const
      return currentChar === expectedChar ? ('correct' as const) : ('incorrect' as const)
    })
  }, [typedText, targetText])

  const isComplete = typedText === targetText
  const caretIndex = typedText.length

  const renderedCharacters = useMemo(() => {
    const characters = targetText.split('').map((char, index) => {
      const state = characterStates[index]

      const styles =
        state === 'correct'
          ? 'text-emerald-400'
          : state === 'incorrect'
            ? 'bg-rose-600/20 text-rose-300'
            : 'text-slate-600'

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
        <span
          key="caret"
          className="relative inline-block w-0 align-baseline"
          aria-hidden
        >
          <span className="absolute left-0 top-1/2 h-[1.25em] w-[2px] -translate-y-1/2 rounded-full bg-emerald-400 animate-caret" />
        </span>,
      )
    }

    return characters
  }, [characterStates, caretIndex, isComplete, targetText])

  const handleRestart = () => {
    setTypedText('')
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
    inputRef.current?.focus()
  }

  const adjustLineLimit = (delta: number) => {
    setLineLimit((previous) =>
      Math.min(LINE_LIMIT_MAX, Math.max(LINE_LIMIT_MIN, previous + delta)),
    )
    inputRef.current?.focus()
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-300">
      <header className="flex h-16 items-center justify-between border-b border-slate-900/60 bg-slate-950/80 px-6 text-sm tracking-wide">
        <span className="text-xs uppercase tracking-[0.4em] text-slate-600">Typist</span>
        <div className="flex items-center gap-4 text-[0.7rem] uppercase tracking-[0.3em] text-slate-600">
          <span>Line Width</span>
          <div className="flex items-center gap-1 rounded-full border border-slate-800/80 px-2 py-1 text-slate-300 shadow-sm">
            <button
              type="button"
              className="rounded-full px-2 text-base text-slate-400 transition hover:text-slate-200 disabled:opacity-30"
              onClick={() => adjustLineLimit(-LINE_LIMIT_STEP)}
              disabled={lineLimit <= LINE_LIMIT_MIN}
              aria-label="Decrease line width"
            >
              &minus;
            </button>
            <span className="min-w-[3.5rem] text-center text-xs tracking-[0.2em] text-slate-200">
              {lineLimit}ch
            </span>
            <button
              type="button"
              className="rounded-full px-2 text-base text-slate-400 transition hover:text-slate-200 disabled:opacity-30"
              onClick={() => adjustLineLimit(LINE_LIMIT_STEP)}
              disabled={lineLimit >= LINE_LIMIT_MAX}
              aria-label="Increase line width"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="rounded-full border border-slate-800/80 px-4 py-1.5 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800/60"
            onClick={handleRestart}
          >
            Restart
          </button>
          <button
            type="button"
            className="rounded-full border border-emerald-400/50 px-4 py-1.5 text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-400/10"
            onClick={handleCustomText}
          >
            Custom Text
          </button>
        </div>
      </header>

      <section
        className="flex flex-1 items-center justify-center px-8"
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        <div
          className="relative mx-auto text-2xl font-medium tracking-wide text-slate-500 leading-[1.6] break-words whitespace-pre-wrap"
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

      <div className="flex h-12 items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-700">
        {typedText.length} / {targetText.length} characters
      </div>
    </main>
  )
}

export default App
