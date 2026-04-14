export interface CaptionLayout {
  lines: string[]
  fontSize: number
  lineHeight: number
  paddingX: number
  paddingY: number
  veilHeight: number
}

const ELLIPSIS = "..."

export const captionMetrics = (cellSize: number): Omit<CaptionLayout, "lines"> => {
  const fontSize = Math.max(11, Math.round(cellSize * 0.05))
  const lineHeight = Math.round(fontSize * 1.22)
  const paddingX = Math.round(cellSize * 0.035)
  const paddingY = Math.round(cellSize * 0.025)
  const veilHeight = Math.round(cellSize * 0.22)

  return {
    fontSize,
    lineHeight,
    paddingX,
    paddingY,
    veilHeight
  }
}

const splitWords = (text: string): string[] => {
  return text.trim().split(/\s+/).filter(Boolean)
}

const ellipsizeText = (
  text: string,
  maxWidth: number,
  measureText: (text: string) => number
): string => {
  if (measureText(text) <= maxWidth) return text
  if (measureText(ELLIPSIS) > maxWidth) return ""

  let low = 0
  let high = text.length
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (measureText(text.slice(0, mid).trimEnd() + ELLIPSIS) <= maxWidth) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  return text.slice(0, low).trimEnd() + ELLIPSIS
}

export const wrapCaptionLines = (
  title: string | undefined,
  maxWidth: number,
  measureText: (text: string) => number,
  maxLines = 2
): string[] => {
  const words = splitWords(title || "")
  if (words.length === 0 || maxLines < 1 || maxWidth <= 0) return []

  const lines: string[] = []
  let current = ""

  words.forEach(word => {
    if (lines.length >= maxLines) return
    const next = current ? `${current} ${word}` : word
    if (measureText(next) <= maxWidth) {
      current = next
      return
    }

    if (current) {
      lines.push(current)
      current = word
      return
    }

    lines.push(ellipsizeText(word, maxWidth, measureText))
    current = ""
  })

  if (current && lines.length < maxLines) {
    lines.push(ellipsizeText(current, maxWidth, measureText))
  }

  if (lines.length === maxLines) {
    const consumedWords = lines.join(" ").split(/\s+/).filter(Boolean).length
    if (consumedWords < words.length) {
      lines[maxLines - 1] = ellipsizeText(`${lines[maxLines - 1]} ${words.slice(consumedWords).join(" ")}`, maxWidth, measureText)
    } else {
      lines[maxLines - 1] = ellipsizeText(lines[maxLines - 1], maxWidth, measureText)
    }
  }

  return lines.filter(Boolean)
}

export const buildCaptionLayout = (
  title: string | undefined,
  cellSize: number,
  measureText: (text: string) => number
): CaptionLayout => {
  const metrics = captionMetrics(cellSize)
  const maxWidth = cellSize - metrics.paddingX * 2

  return {
    ...metrics,
    lines: wrapCaptionLines(title, maxWidth, measureText)
  }
}
