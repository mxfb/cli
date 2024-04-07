import path from 'node:path'
import esbuild, { BuildOptions } from 'esbuild'
import { sassPlugin, postcssModules } from 'esbuild-sass-plugin'
import inlineImageModule from 'esbuild-plugin-inline-image'

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
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  plugins: [
    inlineImageModule({ limit: -1 }),
    sassPlugin({ filter: /\.module\.scss$/, type: 'css', transform: postcssModules({}) }),
    sassPlugin({ filter: /.scss$/, type: 'css' })
  ]
} 

if (process.env.WATCH === 'true') {
  const ctx = await esbuild.context(options)
  await ctx.watch()
  console.log('watching...')
} else {
  esbuild.build(options)
}
