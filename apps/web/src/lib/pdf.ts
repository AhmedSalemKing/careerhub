/**
 * Open a PDF or document via Google Docs viewer (never through axios/api).
 * Always uses window.open() directly so no API prefix is prepended.
 */
export function openPDF(url: string | null | undefined): void {
  if (!url) return
  const safeUrl = url.startsWith('http')
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL || ''}${url.startsWith('/') ? '' : '/'}${url}`
  window.open(
    `https://docs.google.com/viewer?url=${encodeURIComponent(safeUrl)}`,
    '_blank',
    'noopener,noreferrer',
  )
}

/**
 * Trigger a file download directly in the browser.
 * Always uses a plain <a> click — never goes through axios.
 */
export function downloadFile(url: string | null | undefined, filename?: string): void {
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'file'
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
