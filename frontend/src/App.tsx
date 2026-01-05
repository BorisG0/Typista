import { useEffect, useMemo, useRef, useState } from 'react'

import { generateText } from './api/generate'
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

const FREESTYLE_PREVIEW = 'free '
const FREESTYLE_CHOICE: ChoiceDisplay = { id: 'freestyle', preview: FREESTYLE_PREVIEW }

const App = () => {
  const [currentNode, setCurrentNode] = useState<TypingNode>(BRANCHING_ROOT)
  const [typedText, setTypedText] = useState('')
  const [choiceBuffer, setChoiceBuffer] = useState('')
  const [lineLimit, setLineLimit] = useState(48)
  const [totalTyped, setTotalTyped] = useState(0)
  const [freestyleMode, setFreestyleMode] = useState(false)
  const [freestyleInput, setFreestyleInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
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
  // Graph is never truly "complete" since freestyle is always available
  // But we consider it complete if no successor choices and not in freestyle mode
  const isGraphComplete = false

  const { liveWpm, finalWpm, typingStarted, reset: resetWpm } = useWpm(totalTyped, isGraphComplete)

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true)
    try {
      const generatedText = await generateText(prompt)
      const normalized = normalizePrompt(generatedText)
      if (normalized.length > 0) {
        const freestyleNode: TypingNode = {
          id: `freestyle-${Date.now()}`,
          text: normalized,
          successors: [],
        }
        setCurrentNode(freestyleNode)
        setTypedText('')
        setChoiceBuffer('')
        setFreestyleMode(false)
        setFreestyleInput('')
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isGenerating) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        setTypedText('')
        setChoiceBuffer('')
        setTotalTyped(0)
        setFreestyleMode(false)
        setFreestyleInput('')
        resetWpm()
        return
      }

      // Handle freestyle mode
      if (freestyleMode) {
        if (event.key === 'Enter') {
          event.preventDefault()
          if (freestyleInput.trim().length > 0) {
            handleGenerate(freestyleInput.trim())
          }
          return
        }

        if (event.key === 'Backspace') {
          event.preventDefault()
          if (freestyleInput.length > 0) {
            setFreestyleInput(freestyleInput.slice(0, -1))
            setTotalTyped((count) => Math.max(0, count - 1))
          } else {
            // Exit freestyle mode if backspacing with empty input
            setFreestyleMode(false)
            setChoiceBuffer(FREESTYLE_PREVIEW.slice(0, -1))
          }
          return
        }

        if (event.key.length === 1) {
          event.preventDefault()
          setFreestyleInput(freestyleInput + event.key)
          setTotalTyped((count) => count + 1)
        }
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

      // Node complete, handle choice selection
      event.preventDefault()
      const nextBuffer = `${choiceBuffer}${char}`
      setChoiceBuffer(nextBuffer)
      setTotalTyped((count) => count + 1)

      // Check for freestyle match
      if (nextBuffer === FREESTYLE_PREVIEW) {
        setFreestyleMode(true)
        setChoiceBuffer('')
        return
      }

      const matchedChoice = choiceDetails.find((choice) => choice.preview === nextBuffer)

      if (matchedChoice) {
        setCurrentNode(matchedChoice.node)
        setTypedText(nextBuffer)
        setChoiceBuffer('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [choiceBuffer, choiceDetails, currentNode, freestyleInput, freestyleMode, isGenerating, resetWpm, typedText])

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
    setFreestyleMode(false)
    setFreestyleInput('')
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
    () => [
      ...choiceDetails.map(({ node, preview }) => ({
        id: node.id,
        preview,
      })),
      FREESTYLE_CHOICE,
    ],
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
        freestyleMode={freestyleMode}
        freestyleInput={freestyleInput}
        isGenerating={isGenerating}
      />

      <div className="flex h-12 items-center justify-center text-xs uppercase tracking-[0.3em] text-gray-600">
        {typedText.length} / {currentNode.text.length} characters
      </div>
    </main>
  )
}

export default App
