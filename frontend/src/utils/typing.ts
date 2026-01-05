export type TypingNode = {
  id: string
  text: string
  successors: TypingNode[]
}

export const LINE_LIMIT_MIN = 24
export const LINE_LIMIT_MAX = 80
export const LINE_LIMIT_STEP = 4

export const normalizePrompt = (input: string) =>
  input
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim()

export const createSuccessorPreview = (text: string, minLength = 6) => {
  const trimmed = text.trimStart()
  if (!trimmed) return ''

  const wordRegex = /\S+\s*/g
  let endIndex = 0

  while (true) {
    const next = wordRegex.exec(trimmed)
    if (next == null) {
      break
    }

    endIndex = wordRegex.lastIndex
    if (endIndex >= minLength) {
      break
    }
  }

  if (endIndex === 0) {
    endIndex = trimmed.length
  }

  return trimmed.slice(0, endIndex)
}

const scriptSuccessSignal: TypingNode = {
  id: 'script-signal',
  text: 'The console flashes "Fish connected" and a trout surfaces wearing a tiny headset.',
  successors: [],
}

const scriptSuccessChaos: TypingNode = {
  id: 'script-chaos',
  text: 'Instead, the script segfaults, blasting bubbles that startle every duck on the lake.',
  successors: [],
}

const gadgetSuccessCatfish: TypingNode = {
  id: 'gadget-catfish',
  text: 'The lure chirps in Morse code, coaxing a catfish that returns with a lost keyboard.',
  successors: [],
}

const gadgetSuccessSeagull: TypingNode = {
  id: 'gadget-seagull',
  text: 'A rogue seagull nabs the glowing lure, triggering a frantic waterside git revert.',
  successors: [],
}

const scriptPath: TypingNode = {
  id: 'script-path',
  text: 'opens the terminal to run a script that promises to summon cooperative trout.',
  successors: [scriptSuccessSignal, scriptSuccessChaos],
}

const gadgetPath: TypingNode = {
  id: 'gadget-path',
  text: 'unpacks a 3D-printed lure powered by a USB cable knotted like legacy code.',
  successors: [gadgetSuccessCatfish, gadgetSuccessSeagull],
}

export const BRANCHING_ROOT: TypingNode = {
  id: 'lakeside',
  text: 'A programmer marches to the lake balancing a laptop atop a fishing rod.',
  successors: [scriptPath, gadgetPath],
}
