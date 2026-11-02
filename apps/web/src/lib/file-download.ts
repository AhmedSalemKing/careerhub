/**
 * Helpers for files uploaded as quiz answers.
 *
 * Cloudinary `raw` assets (PDFs, Word files, ...) are served from URLs whose
 * last segment may not contain the original extension, and the CDN responds
 * with `Content-Disposition: attachment; filename="file"`. Browsers ignore the
 * `download` attribute for cross-origin URLs, so a plain `<a download>` still
 * saves the answer as an extension-less "file". Fetching the bytes and saving
 * them via a blob URL lets us use the filename the student uploaded.
 */

const PDF_EXTENSION = '.pdf'

/** URL for embedding a document inside the page (Google Docs Viewer). */
export function getFilePreviewUrl(url?: string | null): string | null {
  if (!url) return null
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
}

/** Best-effort filename for the answer, always with an extension. */
export function getDownloadFilename(url?: string | null, fileName?: string | null): string {
  const stored = (fileName ?? '').trim()
  if (stored) {
    const safe = sanitize(stored)
    return hasExtension(safe) ? safe : `${safe}${PDF_EXTENSION}`
  }

  if (!url) return `answer${PDF_EXTENSION}`

  const lastSegment = url.split('?')[0].split('#')[0].split('/').filter(Boolean).pop() ?? ''
  let decoded = lastSegment
  try {
    decoded = decodeURIComponent(lastSegment)
  } catch {
    // Keep the raw segment when it is not valid percent-encoding.
  }

  const safe = sanitize(decoded)
  if (!safe) return `answer${PDF_EXTENSION}`
  return hasExtension(safe) ? safe : `${safe}${PDF_EXTENSION}`
}

/** Whether the answer should be previewed as a PDF. */
export function isPdfFile(url?: string | null, fileName?: string | null): boolean {
  return getDownloadFilename(url, fileName).toLowerCase().endsWith(PDF_EXTENSION)
}

/**
 * Downloads the file with its original name. Falls back to opening the URL in a
 * new tab when the CDN blocks the CORS fetch.
 */
export async function downloadFile(url?: string | null, fileName?: string | null): Promise<void> {
  if (!url) return
  const name = getDownloadFilename(url, fileName)

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim()
}

function hasExtension(name: string): boolean {
  return /\.[A-Za-z0-9]{1,10}$/.test(name)
}
