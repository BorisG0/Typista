type ToolbarProps = {
  lineLimit: number
  canDecrease: boolean
  canIncrease: boolean
  onDecrease: () => void
  onIncrease: () => void
  onRestart: () => void
  onCustomText: () => void
  wpmLabel: string
  wpmStatus: 'idle' | 'live' | 'final'
}

const Toolbar = ({
  lineLimit,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
  onRestart,
  onCustomText,
  wpmLabel,
  wpmStatus,
}: ToolbarProps) => {
  const wpmClasses =
    wpmStatus === 'live' ? 'text-white animate-pulse-slow' : 'text-white'

  return (
    <header className="flex h-16 items-center border-b border-white/10 bg-black/95 px-6 text-xs uppercase tracking-[0.3em]">
      <span className="text-gray-400">Typist</span>

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
              onClick={onDecrease}
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
              onClick={onIncrease}
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
