import http from 'node:http'
import debugModule from 'debug'
import { Express } from 'express'

interface NodeError extends Error {
  syscall?: string
  code?: string
}

export function serve (app: Express) {
  const port = normalizePort(process.env.PORT ?? '3000')
  const debug = debugModule('<<@design-edito/cli----replace-with-name>>:server')
  const server = http.createServer(app)
  app.set('port', port)
  server.listen(port)
  server.on('error', (error: NodeError) => {
    if (error.syscall !== 'listen') throw error
    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges')
        return process.exit(1)
      case 'EADDRINUSE':
        console.error(bind + ' is already in use')
        return process.exit(1)
      default:
        throw error
    }
  })
  server.on('listening', () => {
    var addr = server.address()
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + (addr?.port ?? '')
    debug('Listening on ' + bind)
  })

  function normalizePort (val: string) {
    var port = parseInt(val, 10)
    if (isNaN(port)) return val
    if (port >= 0) return port
    return false
  }
}
