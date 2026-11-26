import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../src/styles')
const distDir = path.resolve(__dirname, '../dist')

fs.mkdirSync(distDir, { recursive: true })

for (const file of ['tokens.css', 'base.css', 'prose.css', 'workbench.css']) {
  fs.copyFileSync(path.join(srcDir, file), path.join(distDir, file))
}
