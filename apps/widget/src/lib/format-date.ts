const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatRequestDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}
