import { useMemo } from 'react'

type TypingCanvasProps = {
  targetText: string
  typedText: string
  caretIndex: number
  isComplete: boolean
  lineLimit: number
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}

const TypingCanvas = ({
  targetText,
  typedText,
  caretIndex,
  isComplete,
  lineLimit,
  inputRef,
}: TypingCanvasProps) => {
  const renderedCharacters = useMemo(() => {
    const characters = targetText.split('').map((char, index) => {
      const currentChar = typedText[index]

      const styles =
        currentChar == null
          ? 'text-gray-500'
          : currentChar === char
            ? 'text-white'
            : 'text-red-500'

      return (
        <span key={`char-${index}`} className={`rounded px-0.5 transition-colors ${styles}`}>
          {char === ' ' ? ' ' : char}
        </span>
      )
    })

    if (!isComplete) {
      characters.splice(caretIndex, 0, <span key="caret" className="caret-cursor" aria-hidden />)
    }

    return characters
  }, [caretIndex, isComplete, targetText, typedText])

  return (
    <section
      className="flex flex-1 items-center justify-center px-8"
      onClick={() => inputRef.current?.focus()}
      role="presentation"
    >
      <div
        className="relative mx-auto break-words whitespace-pre-wrap text-2xl tracking-wide text-gray-500 leading-[1.6]"
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
  )
}

export default TypingCanvas
