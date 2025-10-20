import { useEffect, useMemo, useRef, useState } from 'react'

const TARGET_TEXT =
  'Focus on accuracy first, speed follows when your fingers trust the keys.'

const App = () => {
  const [typedText, setTypedText] = useState('')
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
          if (previous.length >= TARGET_TEXT.length) return previous
          return `${previous}${event.key}`
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const characterStates = useMemo(() => {
    return TARGET_TEXT.split('').map((expectedChar, index) => {
      const currentChar = typedText[index]
      if (currentChar == null) return 'pending' as const
      return currentChar === expectedChar ? ('correct' as const) : ('incorrect' as const)
    })
  }, [typedText])

  const isComplete = typedText === TARGET_TEXT
  const caretIndex = typedText.length

  const renderedCharacters = useMemo(() => {
    const characters = TARGET_TEXT.split('').map((char, index) => {
      const state = characterStates[index]

      const styles =
        state === 'correct'
          ? 'text-emerald-400'
          : state === 'incorrect'
            ? 'bg-rose-600/20 text-rose-300'
            : 'text-slate-600'

      return (
        <span key={`char-${index}`} className={`inline-block rounded align-baseline px-0.5 transition-colors ${styles}`}>
          {char === ' ' ? '\u00A0' : char}
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
  }, [characterStates, caretIndex, isComplete])

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      onClick={() => inputRef.current?.focus()}
      role="presentation"
    >
      <div className="relative w-fit whitespace-nowrap text-2xl font-medium tracking-wide text-slate-600 leading-[1.2]">
        <textarea
          ref={inputRef}
          className="absolute h-0 w-0 opacity-0"
          value={typedText}
          readOnly
          aria-hidden
        />
        {renderedCharacters}
      </div>
    </main>
  )
}

export default App
