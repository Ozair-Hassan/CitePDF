import * as pdfjsLib from 'pdfjs-dist'

let workerInitialized = false

export function initPdfWorker(workerSrc?: string) {
  if (workerInitialized) return
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    workerSrc ??
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  workerInitialized = true
}
