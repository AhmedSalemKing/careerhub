const http = require('http')
const httpProxy = require('http-proxy')

const proxy = httpProxy.createProxyServer({ ws: true })

// Handle Cloudflare tunnel warning bypass
proxy.on('proxyRes', (proxyRes, req, res) => {
  // Remove X-Frame-Options to allow embedding
  delete proxyRes.headers['x-frame-options']
  // Add CORS for tunnel
  proxyRes.headers['access-control-allow-origin'] = '*'
})

proxy.on('error', (err, req, res) => {
  console.error('[Proxy Error]', err.message)
  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end('Proxy error: ' + err.message)
  }
})

const server = http.createServer((req, res) => {
  const url = req.url || '/'

  // Route /learn/* → 3002
  if (url.startsWith('/learn')) {
    req.url = url.replace(/^\/learn/, '') || '/'
    console.log('[→ 3002]', req.method, req.url)
    proxy.web(req, res, { target: 'http://localhost:3002', changeOrigin: true })
    return
  }

  // Route /api/* → 3001
  if (url.startsWith('/api')) {
    console.log('[→ 3001]', req.method, url)
    proxy.web(req, res, { target: 'http://localhost:3001', changeOrigin: true })
    return
  }

  // Route /uploads/* → 3001 (static files served by API)
  if (url.startsWith('/uploads')) {
    console.log('[→ 3001 uploads]', url)
    proxy.web(req, res, { target: 'http://localhost:3001', changeOrigin: true })
    return
  }

  // Everything else → 3000
  console.log('[→ 3000]', req.method, url)
  proxy.web(req, res, { target: 'http://localhost:3000', changeOrigin: true })
})

// WebSocket support (Next.js HMR)
server.on('upgrade', (req, socket, head) => {
  const url = req.url || '/'
  if (url.startsWith('/learn')) {
    proxy.ws(req, socket, head, { target: 'http://localhost:3002' })
  } else {
    proxy.ws(req, socket, head, { target: 'http://localhost:3000' })
  }
})

const PORT = 8080
server.listen(PORT, () => {
  console.log('╔════════════════════════════════╗')
  console.log('║  DeveWay Proxy running         ║')
  console.log('║  localhost:8080                ║')
  console.log('║  /       → 3000 (main)         ║')
  console.log('║  /learn  → 3002 (LMS)          ║')
  console.log('║  /api    → 3001 (API)          ║')
  console.log('║  /uploads→ 3001 (static)       ║')
  console.log('╚════════════════════════════════╝')
})
