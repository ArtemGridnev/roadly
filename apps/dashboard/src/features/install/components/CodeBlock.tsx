import { Prism, useTokenize, type Token } from 'prism-react-renderer'
import { cn } from '@/lib/utils'
import { CopyButton } from './CopyButton'

export type CodeLanguage = 'markup' | 'javascript'

const TOKEN_CLASSES: Record<string, string> = {
  comment: 'text-muted-foreground italic',
  tag: 'text-rose-700 dark:text-rose-300',
  'attr-name': 'text-amber-700 dark:text-amber-300',
  'attr-value': 'text-green-700 dark:text-green-300',
  string: 'text-green-700 dark:text-green-300',
  'template-string': 'text-green-700 dark:text-green-300',
  keyword: 'text-violet-700 dark:text-violet-300',
  boolean: 'text-orange-700 dark:text-orange-300',
  number: 'text-orange-700 dark:text-orange-300',
  function: 'text-blue-700 dark:text-blue-300',
  'class-name': 'text-blue-700 dark:text-blue-300',
  property: 'text-sky-700 dark:text-sky-300',
  'literal-property': 'text-sky-700 dark:text-sky-300',
  punctuation: 'text-muted-foreground',
  operator: 'text-muted-foreground',
}

function tokenClass({ types }: Token) {
  const type = [...types].reverse().find((candidate) => candidate in TOKEN_CLASSES)
  return type ? TOKEN_CLASSES[type] : undefined
}

function HighlightedCode({ code, language }: { code: string; language: CodeLanguage }) {
  const lines = useTokenize({ prism: Prism, code, grammar: Prism.languages[language], language })

  return lines.map((line, lineIndex) => (
    <span key={lineIndex}>
      {line.map((token, tokenIndex) =>
        token.empty ? null : (
          <span key={tokenIndex} className={tokenClass(token)}>
            {token.content}
          </span>
        ),
      )}
      {lineIndex < lines.length - 1 ? '\n' : null}
    </span>
  ))
}

interface CodeBlockProps {
  code: string
  copyLabel: string
  language?: CodeLanguage
}

export function CodeBlock({ code, copyLabel, language }: CodeBlockProps) {
  const isOneLine = !code.includes('\n')

  return (
    <div dir="ltr" className="relative">
      <pre
        className={cn(
          'overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-xs leading-relaxed',
          isOneLine ? 'pe-28' : 'pt-12',
        )}
      >
        <code>{language ? <HighlightedCode code={code} language={language} /> : code}</code>
      </pre>
      <div className={cn('absolute end-2', isOneLine ? 'top-1/2 -translate-y-1/2' : 'top-2')}>
        <CopyButton value={code} label={copyLabel} />
      </div>
    </div>
  )
}
