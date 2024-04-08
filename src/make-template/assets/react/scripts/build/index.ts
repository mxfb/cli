import esbuild, { BuildOptions } from 'esbuild'
import path from 'node:path'
import { sassPlugin, postcssModules } from 'esbuild-sass-plugin'
import inlineImageModule from 'esbuild-plugin-inline-image'

const PREACT = process.env.PREACT === 'true'
const WATCH = process.env.WATCH === 'true'

console.log(`scripts/build/index.ts PREACT=${PREACT} WATCH=${WATCH}`)

const options: BuildOptions = {
  format: 'esm',
  entryPoints: [path.join(process.cwd(), 'src/index.tsx')],
  bundle: true,
  outfile: path.join(process.cwd(), 'dist/index.js'),
  minify: true,
  platform: 'browser',
  sourcemap: true,
  target: ['esnext'],
  tsconfig: path.join(process.cwd(), 'src/tsconfig.json'),
  logLevel: 'info',
  jsxFactory: PREACT ? 'h' : 'React.createElement',
  jsxFragment: PREACT ? 'FRAGMENT' : 'React.Fragment',
  plugins: [
    inlineImageModule({ limit: -1 }),
    sassPlugin({ filter: /\.module\.scss$/, type: 'css', transform: postcssModules({}) }),
    sassPlugin({ filter: /.scss$/, type: 'css' })
  ],
  alias: PREACT ? {
    'react': 'preact/compat',
    'react-dom/test-utils': 'preact/test-utils',
    'react-dom': 'preact/compat',
    'react/jsx-runtime': 'preact/jsx-runtime'
  } : {}
}

if (WATCH) {
  const ctx = await esbuild.context(options)
  await ctx.watch()
  console.log('watching...')
} else {
  await esbuild.build(options)
  console.log('built.')
}
