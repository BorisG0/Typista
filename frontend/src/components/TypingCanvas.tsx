import { useEffect, useMemo, useRef } from 'react'
import { useTypingStore } from '../stores/useTypingStore'
import { useUIStore } from '../stores/useUIStore'
import { createSuccessorPreview } from '../utils/typing'

export type ChoiceDisplay = {
  id: string
  preview: string
}

type WordProps = {
  chars: { char: string; typedChar?: string; index: number }[]
  showCaret?: boolean
  caretPosition?: number
}

const Word = ({ chars, showCaret, caretPosition }: WordProps) => {
  return (
    <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
      {chars.map(({ char, typedChar, index }, localIndex) => {
        const styles =
          typedChar == null
            ? 'text-gray-600'
            : typedChar === char
              ? 'text-white'
              : 'text-red-500'

        return (
          <span key={index}>
            {showCaret && localIndex === caretPosition && (
              <span className="caret-cursor" aria-hidden />
            )}
            <span className={`rounded px-0.5 transition-colors ${styles}`}>
              {char}
            </span>
          </span>
        )
      })}
      {showCaret && caretPosition === chars.length && (
        <span className="caret-cursor" aria-hidden />
      )}
    </span>
  )
}

const TypingCanvas = () => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // Subscribe to stores
  const currentNode = useTypingStore((state) => state.currentNode)
  const typedText = useTypingStore((state) => state.typedText)
  const choiceBuffer = useTypingStore((state) => state.choiceBuffer)
  const freestyleMode = useTypingStore((state) => state.freestyleMode)
  const freestyleInput = useTypingStore((state) => state.freestyleInput)
  const isGenerating = useTypingStore((state) => state.isGenerating)
  const lineLimit = useUIStore((state) => state.lineLimit)

  // Focus input when node changes
  useEffect(() => {
    inputRef.current?.focus()
  }, [currentNode])

  // Computed values
  const nodeText = currentNode.text
  const isNodeComplete = typedText.length >= nodeText.length
  const choices: ChoiceDisplay[] = useMemo(
    () => [
      ...currentNode.successors.map((node) => ({
        id: node.id,
        preview: createSuccessorPreview(node.text),
      })),
      { id: 'freestyle', preview: 'free ' },
    ],
    [currentNode.successors]
  )

  const words = useMemo(() => {
    const result = []
    let currentWord: { char: string; typedChar?: string; index: number }[] = []
    let wordStartIndex = 0

    nodeText.split('').forEach((char, index) => {
      const typedChar = typedText[index]

      if (char === ' ' || char === '\n') {
        // Render accumulated word
        if (currentWord.length > 0) {
          const caretInWord = !isNodeComplete && typedText.length >= wordStartIndex && typedText.length < index
          result.push(
            <Word
              key={`word-${wordStartIndex}`}
              chars={currentWord}
              showCaret={caretInWord}
              caretPosition={caretInWord ? typedText.length - wordStartIndex : undefined}
            />
          )
          currentWord = []
        }

        // Render space/newline with caret if needed
        const styles =
          typedChar == null
            ? 'text-gray-600'
            : typedChar === char
              ? 'text-white'
              : 'text-red-500'

        const showCaretHere = !isNodeComplete && typedText.length === index

        result.push(
          <span key={`space-${index}`}>
            {showCaretHere && <span className="caret-cursor" aria-hidden />}
            <span className={`rounded px-0.5 transition-colors ${styles}`}>
              {char}
            </span>
          </span>
        )
        wordStartIndex = index + 1
      } else {
        if (currentWord.length === 0) {
          wordStartIndex = index
        }
        currentWord.push({ char, typedChar, index })
      }
    })

    // Render final word
    if (currentWord.length > 0) {
      const caretInWord = !isNodeComplete && typedText.length >= wordStartIndex
      result.push(
        <Word
          key={`word-${wordStartIndex}`}
          chars={currentWord}
          showCaret={caretInWord}
          caretPosition={caretInWord ? typedText.length - wordStartIndex : undefined}
        />
      )
    }

    return result
  }, [isNodeComplete, nodeText, typedText])

  const showChoices = choices.length > 0 && (isNodeComplete || choiceBuffer.length > 0) && !freestyleMode
  const hasMatch = choices.some((choice) => choice.preview.startsWith(choiceBuffer) && choiceBuffer.length > 0)
  const bufferClasses =
    choiceBuffer.length === 0 ? 'text-gray-600' : hasMatch ? 'text-white' : 'text-red-500'

  return (
    <section
      className="flex flex-1 items-center justify-center px-8"
      onClick={() => inputRef.current?.focus()}
      role="presentation"
    >
      <div
        className="relative mx-auto whitespace-pre-wrap text-2xl tracking-wide text-gray-500 leading-[1.6]"
        style={{ maxWidth: `${lineLimit}ch` }}
      >
        <textarea
          ref={inputRef}
          className="absolute h-0 w-0 opacity-0"
          value={typedText}
          readOnly
          aria-hidden
        />
        {words}

        {isGenerating && (
          <div className="mt-10 text-sm text-gray-500 animate-pulse">
            Generating...
          </div>
        )}

        {freestyleMode && !isGenerating && (
          <div className="mt-10 space-y-2 text-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-600">
              Freestyle — type your prompt, then press Enter
            </div>
            <div className="min-h-[1.5rem] whitespace-pre-wrap text-white">
              {freestyleInput || ' '}
              <span className="caret-cursor" aria-hidden />
            </div>
          </div>
        )}

        {showChoices && !isGenerating && (
          <div className="mt-10 space-y-4 text-sm">
            <div className={`min-h-[1.5rem] whitespace-pre-wrap ${bufferClasses}`}>
              {choiceBuffer || ' '}
              <span className="caret-cursor" aria-hidden />
            </div>

            <ul className="space-y-1 text-xs tracking-[0.1em] text-gray-600">
              {choices.map((choice) => (
                <li key={choice.id} className="flex gap-[0.15em]">
                  {Array.from(choice.preview).map((char, index) => {
                    const typedChar = choiceBuffer[index]
                    let charClass = 'text-gray-600'

                    if (typedChar != null) {
                      charClass = typedChar === char ? 'text-white' : 'text-red-500'
                    }

                    return (
                      <span key={`${choice.id}-${index}`} className={`transition-colors ${charClass}`}>
                        {char === ' ' ? '\u00a0' : char}
                      </span>
                    )
                  })}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

export default TypingCanvas
