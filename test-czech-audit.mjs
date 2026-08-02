/**
 * Automated Czech language audit.
 * Scans user-facing source strings for Czech terms that should not appear.
 * Run: node test-czech-audit.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const SRC = './src'
const IGNORED_FILES = ['scoringEngine.js', 'videoRecommender.js']

const CZECH_PATTERNS = [
  { re: /\bs\.r\.o\./g, label: 's.r.o. (Czech LLC abbreviation)' },
  { re: /ČNB/g, label: 'ČNB (use CNB)' },
  { re: /ČSOB/g, label: 'ČSOB (use CSOB)' },
  { re: /\bDPPO\b/g, label: 'DPPO (Czech corporate tax)' },
  { re: /\bDPFO\b/g, label: 'DPFO (Czech personal tax return)' },
  { re: /\bObrat\b/g, label: 'Obrat (Czech for turnover)' },
  { re: /\bPausalni\b/gi, label: 'Pausalni (Czech for flat-rate)' },
  { re: /\bZivnostnik\b/gi, label: 'Zivnostnik (Czech for sole trader)' },
  { re: /\brozvaha\b/gi, label: 'rozvaha (Czech for balance sheet)' },
  { re: /\bVZZ\b/g, label: 'VZZ (Czech P&L abbreviation)' },
  { re: /potvrzeni zamestnavatele/gi, label: 'potvrzeni zamestnavatele (Czech employer confirmation)' },
  { re: /\bIČO\b/g, label: 'IČO (use ICO or Registration Number)' },
  { re: /\(DAP\)/g, label: '(DAP) Czech tax return abbreviation' },
  { re: /\(DPC\)/g, label: '(DPC) Czech supplemental agreement abbreviation' },
  { re: /\(a\.s\.\)/g, label: '(a.s.) Czech joint-stock abbreviation' },
]

function isComment(line) {
  const trimmed = line.trim()
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('{/*') || trimmed.startsWith('/*')
}

function isConsoleLog(line) {
  return line.includes('console.log') || line.includes('console.warn') || line.includes('console.error')
}

function walkDir(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (entry === 'node_modules' || entry === 'dist') continue
    const stat = statSync(full)
    if (stat.isDirectory()) {
      files.push(...walkDir(full))
    } else if (['.jsx', '.js'].includes(extname(entry))) {
      if (!IGNORED_FILES.includes(entry)) {
        files.push(full)
      }
    }
  }
  return files
}

let violations = 0
const files = walkDir(SRC)

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isComment(line) || isConsoleLog(line)) continue

    for (const { re, label } of CZECH_PATTERNS) {
      re.lastIndex = 0
      if (re.test(line)) {
        // Check if it's inside a string comparison with ARES API values
        if (line.includes("=== 'AKTIVNÍ'") || line.includes("=== 'POZASTAVENÝ'")) continue
        console.error(`  FAIL: ${file}:${i + 1} — ${label}`)
        console.error(`        ${line.trim().slice(0, 120)}`)
        violations++
      }
    }
  }
}

console.log(`\nCzech language audit: scanned ${files.length} files`)
if (violations === 0) {
  console.log('✓ No Czech user-facing text found.')
} else {
  console.error(`✗ ${violations} violation(s) found.`)
}
process.exit(violations > 0 ? 1 : 0)
