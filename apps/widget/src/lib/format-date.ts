export function formatRequestDate(isoDate: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate))
}
