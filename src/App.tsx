import { useEffect, useMemo, useRef, useState } from 'react'

import Toolbar from './components/Toolbar'
import TypingCanvas from './components/TypingCanvas'
import type { ChoiceDisplay } from './components/TypingCanvas'
import { useWpm } from './hooks/useWpm'
import {
  BRANCHING_ROOT,
  LINE_LIMIT_MAX,
  LINE_LIMIT_MIN,
  LINE_LIMIT_STEP,
  createSuccessorPreview,
  normalizePrompt,
} from './utils/typing'
import type { TypingNode } from './utils/typing'

const formatWpmValue = (value: number | null) =>
  value == null ? '--' : Math.max(0, Math.round(value)).toString()

const App = () => {
  const [currentNode, setCurrentNode] = useState<TypingNode>(BRANCHING_ROOT)
  const [typedText, setTypedText] = useState('')
  const [choiceBuffer, setChoiceBuffer] = useState('')
  const [lineLimit, setLineLimit] = useState(48)
  const [totalTyped, setTotalTyped] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [currentNode])

  const isNodeComplete = typedText.length >= currentNode.text.length
  const successors = currentNode.successors
  const choiceDetails = useMemo(
    () =>
      successors.map((node) => ({
        node,
        preview: createSuccessorPreview(node.text),
      })),
    [successors],
  )
  const isGraphComplete = isNodeComplete && choiceDetails.length === 0 && choiceBuffer.length === 0

  const { liveWpm, finalWpm, typingStarted, reset: resetWpm } = useWpm(totalTyped, isGraphComplete)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        setTypedText('')
        setChoiceBuffer('')
        setTotalTyped(0)
        resetWpm()
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()

        if (choiceBuffer.length > 0) {
          setChoiceBuffer(choiceBuffer.slice(0, -1))
          setTotalTyped((count) => Math.max(0, count - 1))
          return
        }

        if (typedText.length > 0) {
          setTypedText(typedText.slice(0, -1))
          setTotalTyped((count) => Math.max(0, count - 1))
        }
        return
      }

      if (event.key.length !== 1) {
        return
      }

      const char = event.key

      if (typedText.length < currentNode.text.length) {
        event.preventDefault()
        setTypedText(`${typedText}${char}`)
        setTotalTyped((count) => count + 1)
        return
      }

      if (choiceDetails.length === 0) {
        event.preventDefault()
        return
      }

      event.preventDefault()
      const nextBuffer = `${choiceBuffer}${char}`
      setChoiceBuffer(nextBuffer)
      setTotalTyped((count) => count + 1)

      const matchedChoice = choiceDetails.find((choice) => choice.preview === nextBuffer)

      if (matchedChoice) {
        setCurrentNode(matchedChoice.node)
        setTypedText(nextBuffer)
        setChoiceBuffer('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [choiceBuffer, choiceDetails, currentNode, resetWpm, typedText])

  const handleLineLimitChange = (delta: number) => {
    setLineLimit((previous) =>
      Math.min(LINE_LIMIT_MAX, Math.max(LINE_LIMIT_MIN, previous + delta)),
    )
    inputRef.current?.focus()
  }

  const handleRestart = () => {
    setCurrentNode(BRANCHING_ROOT)
    setTypedText('')
    setChoiceBuffer('')
    setTotalTyped(0)
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

    const customNode: TypingNode = {
      id: 'custom',
      text: normalized,
      successors: [],
    }

    setCurrentNode(customNode)
    setTypedText('')
    setChoiceBuffer('')
    setTotalTyped(0)
    resetWpm()
    inputRef.current?.focus()
  }

  const decreaseLineWidth = () => handleLineLimitChange(-LINE_LIMIT_STEP)
  const increaseLineWidth = () => handleLineLimitChange(LINE_LIMIT_STEP)

  const successorChoices: ChoiceDisplay[] = useMemo(
    () =>
      choiceDetails.map(({ node, preview }) => ({
        id: node.id,
        preview,
      })),
    [choiceDetails],
  )

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
        nodeText={currentNode.text}
        typedText={typedText}
        isNodeComplete={isNodeComplete}
        choiceBuffer={choiceBuffer}
        choices={successorChoices}
        lineLimit={lineLimit}
        inputRef={inputRef}
      />

      <div className="flex h-12 items-center justify-center text-xs uppercase tracking-[0.3em] text-gray-600">
        {typedText.length} / {currentNode.text.length} characters
      </div>
    </main>
  )
}

export default App
