import esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  bundle: true,
  sourcemap: true,
  platform: 'node',
  target: 'node16',
  format: 'esm',
  logLevel: 'info',
  external: [
    'mailersend',
    'express',
    'cookie-parser',
    'morgan',
    'mongoose',
    'dotenv',
    'debug',
    '@mapbox',
    'jsonwebtoken',
    'bcrypt',
    'util',
    'agenda'
  ]
}).catch(() => process.exit(1))
