import { useUIStore } from '../stores/useUIStore'
import { LINE_LIMIT_MAX, LINE_LIMIT_MIN } from '../utils/typing'

type ToolbarProps = {
  onRestart: () => void
  onCustomText: () => void
  wpmLabel: string
  wpmStatus: 'idle' | 'live' | 'final'
}

const Toolbar = ({
  onRestart,
  onCustomText,
  wpmLabel,
  wpmStatus,
}: ToolbarProps) => {
  const lineLimit = useUIStore((state) => state.lineLimit)
  const increaseLineLimit = useUIStore((state) => state.increaseLineLimit)
  const decreaseLineLimit = useUIStore((state) => state.decreaseLineLimit)
  
  // Computed values
  const canIncrease = useUIStore((state) => state.lineLimit < LINE_LIMIT_MAX)
  const canDecrease = useUIStore((state) => state.lineLimit > LINE_LIMIT_MIN)

  const wpmClasses =
    wpmStatus === 'live' ? 'text-white animate-pulse-slow' : 'text-white'

  return (
    <header className="flex h-16 items-center border-b border-white/10 bg-black/95 px-6 text-xs uppercase tracking-[0.3em]">
      <span className="text-gray-400">Typista</span>

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
            onClick={onRestart}
          >
            Restart
          </button>
          <button
            type="button"
            className="rounded-full border border-white bg-white/90 px-4 py-1.5 text-black transition hover:bg-white/80 hover:text-black"
            onClick={onCustomText}
          >
            Custom Text
          </button>
        </div>
      </div>
    </header>
  )
}

export default Toolbar
