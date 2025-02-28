import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import typescript from '@rollup/plugin-typescript'
import generateDeclarations from 'rollup-plugin-generate-declarations'
import pkg from './package.json'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    typescript({ tsconfig: './tsconfig.json', lib: ['es5', 'es6', 'dom'], module: 'esnext', target: 'es5' }),
    external(),
    url({ exclude: ['**/*.svg'] }),
    babel({
      exclude: 'node_modules/**'
    }),
    resolve(),
    commonjs(),
    generateDeclarations()
  ]
}
