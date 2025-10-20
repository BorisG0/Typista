export const DEFAULT_TEXT =
  'Focus on accuracy first, speed follows when your fingers trust the keys.'

export const LINE_LIMIT_MIN = 24
export const LINE_LIMIT_MAX = 80
export const LINE_LIMIT_STEP = 4

export const normalizePrompt = (input: string) =>
  input
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim()
