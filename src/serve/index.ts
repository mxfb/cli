import { spawn } from 'node:child_process'
import { program } from 'commander'

program
  .name('@design-edito/serve')
  .description('Quickly spawn a HTTP server')
  .argument('[port]', 'Depth', '3000')
  .option('-c, --cache <seconds>', 'Cache duration in seconds', '-1')
  .option('--cors', 'Enable CORS', false)
  .action(async (port, options) => {
    const { cache, cors } = options
    const numericPort = parseInt(port)
    const numericCache = parseInt(cache)
    const httpServerOptions = [
      'http-server',
      '--port', Number.isNaN(numericPort) ? '3000' : numericPort.toString(),
      '--cache', Number.isNaN(numericCache) ? '-1' : numericCache.toString()
    ]
    if (cors) httpServerOptions.push('--cors')
    spawn('npx', httpServerOptions, { stdio: 'inherit' })
    const onShutdown = () => {
      console.log('Exiting...')
      process.exit(0)
    }
    process.on('SIGINT', onShutdown)
    process.on('SIGTERM', onShutdown)
  })

program.parse(process.argv)
