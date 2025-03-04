import { spawn } from 'node:child_process'
import { program } from 'commander'

program
  .name('@design-edito/serve')
  .description('Quickly spawn a HTTP server')
  .argument('[port]', 'Depth (optional, defaults to 3000)', '3000')
  .option('-c, --cache <seconds>', 'Cache duration in seconds (default: -1)', '-1')
  .option('--cors', 'Enable CORS (default: false)', false)
  .action(async (port, options) => {
    spawn('npx', [
      'http-server',
      '--port', port,
      '--cache', options.cache,
      '--cors', options.cors,
    ], { stdio: 'inherit' })
    const onShutdown = () => {
      console.log('Exiting...')
      process.exit(0)
    }
    process.on('SIGINT', onShutdown)
    process.on('SIGTERM', onShutdown)
  })

program.parse(process.argv)
