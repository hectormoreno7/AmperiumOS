import COMPANY_CONFIG from '../config/empresa'

export const roundMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100

export const formatCurrency = (value, options = {}) =>
  new Intl.NumberFormat(COMPANY_CONFIG.locale, {
    style: 'currency',
    currency: COMPANY_CONFIG.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(Number(value || 0))

export const calculateTax = (subtotal, taxRate = COMPANY_CONFIG.defaultTaxRate) =>
  roundMoney(Number(subtotal || 0) * (Number(taxRate || 0) / 100))

export const calculateTotal = ({ subtotal = 0, tax = 0, discount = 0 }) =>
  roundMoney(Number(subtotal) + Number(tax) - Number(discount))
