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

const galleryFinal: TypingNode = {
  id: 'gallery-final',
  text: 'Inside, a lone painting hums softly as if hiding a restless song.',
  successors: [],
}

const dinerFinal: TypingNode = {
  id: 'diner-final',
  text: 'At the counter, an elderly chef slides across a stamped envelope.',
  successors: [],
}

const galleryPath: TypingNode = {
  id: 'gallery-path',
  text: 'walks toward the silent art gallery where lights pulse behind frosted glass.',
  successors: [galleryFinal],
}

const dinerPath: TypingNode = {
  id: 'diner-path',
  text: 'heads into the late-night diner where the jukebox plays a forgotten tune.',
  successors: [dinerFinal],
}

export const BRANCHING_ROOT: TypingNode = {
  id: 'station',
  text: 'A courier steps off the night bus and pauses at the sleepy station.',
  successors: [galleryPath, dinerPath],
}
