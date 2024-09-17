import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import debugModule from 'debug'
import indexRouter from './routes/index.js'

const debug = debugModule('<<@mxfb/cli----replace-with-name>>:server')
const port = normalizePort(process.env.PORT ?? '3000')
const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use('/', indexRouter)
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
