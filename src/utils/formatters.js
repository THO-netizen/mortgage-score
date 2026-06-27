/** Czech locale currency formatter — outputs "1 500 000 Kč" */
export const formatCZK = (n = 0) =>
  new Intl.NumberFormat('cs-CZ', {
    style:                 'currency',
    currency:              'CZK',
    maximumFractionDigits: 0,
  }).format(n)

/** Short form: 1.5 M Kč / 150K Kč */
export const formatCZKShort = (n = 0) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M Kč`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K Kč`
  return `${Math.round(n)} Kč`
}

/** Czech locale number with space-thousands separator */
export const formatNumber = (n = 0) =>
  new Intl.NumberFormat('cs-CZ').format(Math.round(n))
