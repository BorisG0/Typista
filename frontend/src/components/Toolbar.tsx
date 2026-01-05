import { useUIStore } from '../stores/useUIStore'
import { useTypingStore } from '../stores/useTypingStore'
import { LINE_LIMIT_MAX, LINE_LIMIT_MIN } from '../utils/typing'

const formatWpmValue = (value: number | null) =>
  value == null ? '--' : Math.max(0, Math.round(value)).toString()

const Toolbar = () => {
  // UI Store
  const lineLimit = useUIStore((state) => state.lineLimit)
  const increaseLineLimit = useUIStore((state) => state.increaseLineLimit)
  const decreaseLineLimit = useUIStore((state) => state.decreaseLineLimit)
  
  // Typing Store
  const typingState = useTypingStore((state) => state.typingState)
  const liveWpm = useTypingStore((state) => state.liveWpm)
  const finalWpm = useTypingStore((state) => state.finalWpm)
  const startTimestamp = useTypingStore((state) => state.startTimestamp)
  const totalTyped = useTypingStore((state) => state.totalTyped)
  const restart = useTypingStore((state) => state.restart)
  const setCustomText = useTypingStore((state) => state.setCustomText)
  
  // Computed values
  const canIncrease = lineLimit < LINE_LIMIT_MAX
  const canDecrease = lineLimit > LINE_LIMIT_MIN
  const typingStarted = startTimestamp != null && totalTyped > 0
  
  const showFinal = finalWpm != null
  const wpmLabel = showFinal
    ? formatWpmValue(finalWpm)
    : typingStarted
      ? formatWpmValue(liveWpm)
      : '--'

  const wpmStatus: 'idle' | 'live' | 'final' = showFinal
    ? 'final'
    : typingState === 'typing'
      ? 'live'
      : 'idle'

  const wpmClasses =
    wpmStatus === 'live' ? 'text-white animate-pulse-slow' : 'text-white'

  const stateColors = {
    initial: 'text-gray-600',
    typing: 'text-green-500',
    choosing: 'text-yellow-500',
  }

  const handleCustomText = () => {
    const response = window.prompt('Paste the text you would like to practice:')
    if (response != null) {
      setCustomText(response)
    }
  }

  return (
    <header className="flex h-16 items-center border-b border-white/10 bg-black/95 px-6 text-xs uppercase tracking-[0.3em]">
      <span className="text-gray-400">Typista</span>
      
      <div className="ml-6 flex items-center gap-2 text-[0.6rem] tracking-[0.15em]">
        <span className="text-gray-600">State:</span>
        <span className={`font-medium ${stateColors[typingState]}`}>
          {typingState}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <span className={`text-sm tracking-[0.25em] ${wpmClasses}`}>{wpmLabel} WPM</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 text-[0.65rem] tracking-[0.2em] text-gray-500">
          <span>Line Width</span>
          <div className="flex items-center gap-1 rounded-full border border-white/15 px-2 py-1 text-white">
            <button
              type="button"
              className="rounded-full px-2 text-base text-gray-400 transition hover:text-white disabled:opacity-30"
              onClick={decreaseLineLimit}
              disabled={!canDecrease}
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
              onClick={increaseLineLimit}
              disabled={!canIncrease}
              aria-label="Increase line width"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex gap-3 text-[0.65rem] tracking-[0.25em]">
          <button
            type="button"
            className="rounded-full border border-white/20 px-4 py-1.5 text-white transition hover:bg-white/10"
            onClick={restart}
          >
            Restart
          </button>
          <button
            type="button"
            className="rounded-full border border-white bg-white/90 px-4 py-1.5 text-black transition hover:bg-white/80 hover:text-black"
            onClick={handleCustomText}
          >
            Custom Text
          </button>
        </div>
      </div>
    </header>
  )
}

export default Toolbar
