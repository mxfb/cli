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
    spawn('npx', [
      'http-server',
      '--port', Number.isNaN(numericPort) ? 3000 : numericPort,
      '--cache', cache,
      '--cors', typeof cors === 'boolean' ? cors : false,
    ], { stdio: 'inherit' })
    const onShutdown = () => {
      console.log('Exiting...')
      process.exit(0)
    }
    process.on('SIGINT', onShutdown)
    process.on('SIGTERM', onShutdown)
  })

program.parse(process.argv)
