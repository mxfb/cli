import http from 'node:http'
import debugModule from 'debug'
import app from '../app'

const debug = debugModule('<<@mxfb/cli----replace-with-name>>:server')
const port = normalizePort(process.env.PORT ?? '3000')

app.set('port', port)

const server = http.createServer(app)

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

function normalizePort (val: string) {
  var port = parseInt(val, 10)
  if (isNaN(port)) return val
  if (port >= 0) return port
  return false
}

interface NodeError extends Error {
  syscall?: string
  code?: string
}

function onError (error: NodeError) {
  if (error.syscall !== 'listen') throw error
  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

function onListening () {
  var addr = server.address()
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + (addr?.port ?? '')
  debug('Listening on ' + bind)
}
