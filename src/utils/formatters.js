/** Currency formatter — outputs "1,500,000 CZK" */
export const formatCZK = (n = 0) =>
  new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'CZK',
    currencyDisplay:       'code',
    maximumFractionDigits: 0,
  }).format(n).replace('CZK', 'CZK').trim()

/** Short form: 1.5M CZK / 150K CZK */
export const formatCZKShort = (n = 0) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M CZK`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K CZK`
  return `${Math.round(n)} CZK`
}

/** Czech locale number with space-thousands separator */
export const formatNumber = (n = 0) =>
  new Intl.NumberFormat('cs-CZ').format(Math.round(n))
