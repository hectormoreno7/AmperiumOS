export const QUOTATION_STATUS = Object.freeze({
  DRAFT: 'borrador',
  SENT: 'enviada',
  ACCEPTED: 'aceptada',
  IN_PROGRESS: 'en_ejecucion',
  FINISHED: 'finalizada',
  CANCELLED: 'cancelada',
})

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pendiente',
  PARTIAL: 'parcial',
  PAID: 'pagado',
  CANCELLED: 'cancelado',
})

export const SERVICE_STATUS = Object.freeze({
  SCHEDULED: 'programado',
  IN_PROGRESS: 'en_ejecucion',
  FINISHED: 'finalizado',
  ARCHIVED: 'archivado',
  CANCELLED: 'cancelado',
})
