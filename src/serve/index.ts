import { program } from 'commander'
import httpServer from 'http-server'

program
  .name('@design-edito/serve')
  .description('Quickly spawn a HTTP server')
  .argument('[port]', 'Depth (optional, defaults to 3000)')
  .option('-c, --cache <seconds>', 'Cache duration in seconds (default:-1)', '-1')
  .option('--cors <boolean>', 'Enable CORS (default: false)', 'false')
  .action(async (_port, options) => {
    const port = _port !== undefined ? parseInt(_port) : 0
    const cache = parseInt(options.cache)
    const cors = options.cors === 'true'
    if (Number.isNaN(port)) {
      console.error('Port should be a number')
      return process.exit(1)
    }
    const server = httpServer.createServer({ cache, cors })
    server.listen(port, () => console.log(`Server is running on http://localhost:${port}`))
    server.on('error', err => {
      console.error(err)
      return process.exit(1)
    })
    const onShutdown = () => {
      console.log('Shutting down...')
      server.close(err => {
        if (err !== undefined) console.error('Error while shutting down:', err)
        else console.error(`Server stopped at http://localhost:${port}`)
        process.exit(0)
      })
    }
    process.on('SIGINT', onShutdown)
    process.on('SIGTERM', onShutdown)
  })

program.parse(process.argv)
