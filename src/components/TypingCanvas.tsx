import { useMemo } from 'react'

export type ChoiceDisplay = {
  id: string
  preview: string
}

type TypingCanvasProps = {
  nodeText: string
  typedText: string
  isNodeComplete: boolean
  choiceBuffer: string
  choices: ChoiceDisplay[]
  lineLimit: number
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}

const TypingCanvas = ({
  nodeText,
  typedText,
  isNodeComplete,
  choiceBuffer,
  choices,
  lineLimit,
  inputRef,
}: TypingCanvasProps) => {
  const characters = useMemo(() => {
    const list = nodeText.split('').map((char, index) => {
      const typedChar = typedText[index]

      const styles =
        typedChar == null
          ? 'text-gray-600'
          : typedChar === char
            ? 'text-white'
            : 'text-red-500'

      return (
        <span key={`char-${index}`} className={`rounded px-0.5 transition-colors ${styles}`}>
          {char === ' ' ? ' ' : char}
        </span>
      )
    })

    if (!isNodeComplete) {
      list.splice(typedText.length, 0, <span key="caret" className="caret-cursor" aria-hidden />)
    }

    return list
  }, [isNodeComplete, nodeText, typedText])

  const showChoices = choices.length > 0 && (isNodeComplete || choiceBuffer.length > 0)
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
        {characters}

        {showChoices && (
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
