import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import defaultLogo from '../../../assets/branding/logos/logo-horizontal-simple.png'
import { getConfiguration } from '../../configuracion/services/configuracionService'

const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0))

const imageToDataUrl = async (url) => {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export const generateNotePdf = async (
  note,
) => {
  const configuration =
    await getConfiguration()
  const document = new jsPDF({
    unit: 'mm',
    format: 'letter',
  })
  const logo = await imageToDataUrl(
    configuration.logoUrl ||
      defaultLogo,
  ).catch(() => null)

  if (logo) {
    document.addImage(
      logo,
      'PNG',
      15,
      12,
      62,
      18,
      undefined,
      'FAST',
    )
  }

  document.setFont(
    'helvetica',
    'bold',
  )
  document.setFontSize(18)
  document.text(
    'NOTA / RECIBO',
    200,
    19,
    { align: 'right' },
  )
  document.setFontSize(9)
  document.text(
    note.folio,
    200,
    26,
    { align: 'right' },
  )

  document.setDrawColor(212, 160, 23)
  document.setLineWidth(1)
  document.line(15, 34, 200, 34)

  document.setFontSize(10)
  document.text(
    `Cliente: ${note.clientName || 'Venta rápida'}`,
    15,
    44,
  )
  document.text(
    `Teléfono: ${note.phone || '—'}`,
    15,
    51,
  )
  document.text(
    `Pago: ${note.paymentMethod}${
      note.paymentDetails
        ? ` · ${note.paymentDetails}`
        : ''
    }`,
    15,
    58,
  )

  autoTable(document, {
    startY: 67,
    head: [[
      'Cant.',
      'Descripción',
      'Costo',
      'Importe',
    ]],
    body: note.items.map((item) => [
      item.quantity,
      item.description,
      money(item.unitCost),
      money(
        item.quantity * item.unitCost,
      ),
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [36, 36, 36],
      textColor: [255, 255, 255],
    },
  })

  let y =
    document.lastAutoTable.finalY + 9
  document.text(
    `Subtotal: ${money(note.subtotal)}`,
    200,
    y,
    { align: 'right' },
  )
  if (note.taxEnabled) {
    y += 7
    document.text(
      `IVA ${note.taxRate}%: ${money(note.tax)}`,
      200,
      y,
      { align: 'right' },
    )
  }
  y += 8
  document.setFontSize(14)
  document.text(
    `TOTAL: ${money(note.total)}`,
    200,
    y,
    { align: 'right' },
  )

  if (note.signature) {
    document.addImage(
      note.signature,
      'PNG',
      75,
      y + 14,
      65,
      25,
      undefined,
      'FAST',
    )
    document.setFontSize(8)
    document.text(
      'Firma de conformidad',
      107.5,
      y + 43,
      { align: 'center' },
    )
  }

  document.setFontSize(7)
  document.text(
    `${configuration.companyName} · ${configuration.phone} · ${configuration.email} · ${configuration.address}`,
    107.5,
    270,
    { align: 'center' },
  )
  document.save(
    `${note.folio || 'nota'}.pdf`,
  )
}
