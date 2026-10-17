const MAX_LENGTH = 40

export function slugify(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, MAX_LENGTH)
    .replace(/^-+|-+$/g, '')
}

export function nextSlug(slug: string) {
  const match = /^(.*)-(\d+)$/.exec(slug)
  const [base, n] = match ? [match[1], Number(match[2]) + 1] : [slug, 2]
  const suffix = `-${n}`

  return `${base.slice(0, MAX_LENGTH - suffix.length).replace(/-+$/, '')}${suffix}`
}
