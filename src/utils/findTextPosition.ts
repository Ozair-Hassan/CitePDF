import type { PDFPageProxy } from 'pdfjs-dist'
import type { BoundingBox } from '../types'

function normaliseWord(w: string): string {
  return (
    w
      // ligatures
      .replace(/ﬁ/g, 'fi')
      .replace(/ﬂ/g, 'fl')
      .replace(/ﬀ/g, 'ff')
      .replace(/ﬃ/g, 'ffi')
      .replace(/ﬄ/g, 'ffl')
      .replace(/ﬅ|ﬆ/g, 'st')
      .replace(/[\u2012\u2013\u2014\u2015]/g, '-')
      .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
      .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
      .replace(/[\u00ad\u200b\u200c\u200d\ufeff]/g, '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '')
      .toLowerCase()
  )
}

function tokenize(str: string): string[] {
  return str
    .split(/[\s\u00a0]+/)
    .map(normaliseWord)
    .filter(Boolean)
}

type PdfWord = {
  word: string
  x: number
  y: number
  width: number
  height: number
  hyphenNext?: boolean
}

function matchesQueryWord(
  queryWord: string,
  pdfWords: PdfWord[],
  wi: number,
): 0 | 1 | 2 {
  const pw = pdfWords[wi]
  if (pw.word === queryWord) return 1
  if (
    pw.hyphenNext &&
    wi + 1 < pdfWords.length &&
    pw.word + pdfWords[wi + 1].word === queryWord
  )
    return 2
  return 0
}

const MAX_SPAN_RATIO = 4.0

type ScanResult = {
  matchCount: number
  startIdx: number
  endIdx: number
}

function forwardScan(
  queryWords: string[],
  pdfWords: PdfWord[],
  startIdx: number,
): ScanResult {
  const limit = Math.min(
    pdfWords.length,
    startIdx + Math.ceil(queryWords.length * MAX_SPAN_RATIO),
  )
  let qi = 0
  let endIdx = startIdx
  let wi = startIdx

  while (wi < limit && qi < queryWords.length) {
    const consumed = matchesQueryWord(queryWords[qi], pdfWords, wi)
    if (consumed > 0) {
      qi++
      endIdx = wi + consumed - 1
      wi += consumed
    } else {
      wi++
    }
  }

  return { matchCount: qi, startIdx, endIdx }
}

function findBestSpan(
  queryWords: string[],
  pdfWords: PdfWord[],
): ScanResult | null {
  let best: ScanResult = { matchCount: 0, startIdx: 0, endIdx: 0 }

  for (let i = 0; i < pdfWords.length; i++) {
    const consumed = matchesQueryWord(queryWords[0], pdfWords, i)
    if (consumed === 0) continue

    const result = forwardScan(queryWords, pdfWords, i)

    const betterCount = result.matchCount > best.matchCount
    const sameCountTighter =
      result.matchCount === best.matchCount &&
      result.endIdx - result.startIdx < best.endIdx - best.startIdx

    if (betterCount || sameCountTighter) best = result

    if (best.matchCount === queryWords.length) break
  }

  return best.matchCount > 0 ? best : null
}

const MATCH_THRESHOLD = 0.45

export async function findTextPosition(
  page: PDFPageProxy,
  searchText: string,
): Promise<BoundingBox[]> {
  const queryWords = tokenize(searchText)
  if (queryWords.length === 0) return []

  const viewport = page.getViewport({ scale: 1 })
  const content = await page.getTextContent()

  const pdfWords: PdfWord[] = []

  for (const rawItem of content.items) {
    const item = rawItem as {
      str?: string
      transform?: number[]
      width?: number
      height?: number
    }
    if (!item.str || !item.transform) continue

    const endsWithHyphen = /\S-$/.test(item.str)

    const tx = item.transform
    const itemW = item.width ?? 0
    const itemH = Math.abs(item.height ?? Math.abs(tx[3]))
    const [cx, cy] = viewport.convertToViewportPoint(tx[4], tx[5])
    const top = cy - itemH

    const cleaned = item.str.replace(/-$/, '')
    const words = cleaned.split(/[\s\u00a0]+/).filter(Boolean)
    if (words.length === 0) continue

    const totalChars = words.reduce((sum, w) => sum + w.length, 0) || 1
    let xOffset = 0

    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      const wWidth = (w.length / totalChars) * itemW
      const isLastWord = i === words.length - 1

      pdfWords.push({
        word: normaliseWord(w),
        x: cx + xOffset,
        y: top,
        width: wWidth,
        height: itemH,
        ...(endsWithHyphen && isLastWord ? { hyphenNext: true } : {}),
      })
      xOffset += wWidth
    }
  }

  if (pdfWords.length === 0) return []

  const span = findBestSpan(queryWords, pdfWords)

  if (!span) {
    console.warn(`[CitePDF] No match for: "${searchText.slice(0, 60)}…"`)
    return []
  }

  const score = span.matchCount / queryWords.length

  if (score < MATCH_THRESHOLD) {
    console.warn(
      `[CitePDF] No match for: "${searchText.slice(0, 60)}…"`,
      `(best score: ${score.toFixed(2)}, threshold: ${MATCH_THRESHOLD})`,
    )
    return []
  }

  console.log(
    `[CitePDF] Match "${searchText.slice(0, 40)}…" score=${score.toFixed(2)}`,
    `words ${span.startIdx}–${span.endIdx}`,
  )

  const matched = pdfWords.slice(span.startIdx, span.endIdx + 1)

  const avgH = matched.reduce((s, w) => s + w.height, 0) / matched.length
  const tolerance = avgH * 0.5

  const lines: PdfWord[][] = []
  for (const word of matched) {
    const line = lines.find((l) => Math.abs(l[0].y - word.y) <= tolerance)
    if (line) line.push(word)
    else lines.push([word])
  }

  return lines.map((line) => ({
    x: Math.min(...line.map((w) => w.x)) - 2,
    y: Math.min(...line.map((w) => w.y)) - 2.5,
    width:
      Math.max(...line.map((w) => w.x + w.width)) -
      Math.min(...line.map((w) => w.x)) +
      4,
    height:
      Math.max(...line.map((w) => w.y + w.height)) -
      Math.min(...line.map((w) => w.y)) +
      5,
  }))
}
