export const formatNumber = (value, decimals = 0) =>
  new Intl.NumberFormat('es-HN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    .format(Number(value || 0))

export const formatCurrency = value =>
  new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', maximumFractionDigits: 2 })
    .format(Number(value || 0))

export const formatDate = value => {
  if (!value) return 'Sin fecha'
  const date = new Date(`${value}`.length === 10 ? `${value}T12:00:00` : value)
  return new Intl.DateTimeFormat('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}
