const files = import.meta.glob('../assets/images/*.{webp,png,jpg,jpeg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byName = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop(), url])
)

export function resolveImage(value) {
  if (!value) return undefined
  if (/^(https?:)?\/\//.test(value) || value.startsWith('/') || value.startsWith('data:')) return value
  return byName[value]
}