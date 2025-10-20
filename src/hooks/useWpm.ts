import { useCallback, useEffect, useState } from 'react'

const CHARACTERS_PER_WORD = 5

const computeWpm = (charactersTyped: number, elapsedMs: number) => {
  if (elapsedMs <= 0) return 0
  const minutes = elapsedMs / 60000
  const words = charactersTyped / CHARACTERS_PER_WORD
  const wpm = words / minutes
  if (!Number.isFinite(wpm) || wpm < 0) {
    return 0
  }
  return wpm
}

export const useWpm = (charactersTyped: number, isComplete: boolean) => {
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null)
  const [liveWpm, setLiveWpm] = useState(0)
  const [finalWpm, setFinalWpm] = useState<number | null>(null)

  const reset = useCallback(() => {
    setStartTimestamp(null)
    setLiveWpm(0)
    setFinalWpm(null)
  }, [])

  useEffect(() => {
    if (charactersTyped <= 0 || startTimestamp != null) {
      return
    }
    setStartTimestamp(Date.now())
  }, [charactersTyped, startTimestamp])

  useEffect(() => {
    if (startTimestamp == null || charactersTyped <= 0) {
      return
    }

    const update = () => {
      setLiveWpm(computeWpm(charactersTyped, Date.now() - startTimestamp))
    }

    update()

    if (isComplete) {
      return
    }

    const intervalId = window.setInterval(update, 200)
    return () => window.clearInterval(intervalId)
  }, [charactersTyped, isComplete, startTimestamp])

  useEffect(() => {
    if (!isComplete || startTimestamp == null) {
      return
    }

    const finalValue = computeWpm(charactersTyped, Date.now() - startTimestamp)
    setFinalWpm(finalValue)
    setLiveWpm(finalValue)
  }, [charactersTyped, isComplete, startTimestamp])

  const typingStarted = startTimestamp != null && charactersTyped > 0

  return {
    liveWpm,
    finalWpm,
    typingStarted,
    reset,
  }
}
