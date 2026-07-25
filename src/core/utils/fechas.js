import COMPANY_CONFIG from '../config/empresa'

const toDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatLongDate = (value, options = {}) => {
  const date = toDate(value)
  if (!date) return ''

  return new Intl.DateTimeFormat(COMPANY_CONFIG.locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(date)
}

export const formatShortDate = (value) => {
  const date = toDate(value)
  if (!date) return ''

  return new Intl.DateTimeFormat(COMPANY_CONFIG.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export const addDays = (value, days) => {
  const date = toDate(value) ?? new Date()
  const result = new Date(date)
  result.setDate(result.getDate() + Number(days || 0))
  return result
}

export const toISOString = (value) => toDate(value)?.toISOString() ?? null
