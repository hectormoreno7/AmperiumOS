import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '../../../assets/branding/logos/logo-horizontal-simple.png'
import { getConfiguration } from '../../configuracion/services/configuracionService'

const COMPANY = {
  responsible: 'Ing. Héctor Zárate',
  phone: '2284055421',
  email: 'amperiumoficial@gmail.com',
  location: 'Xalapa, Veracruz',
}

const GOLD = [212, 160, 23]
const GRAPHITE = [28, 29, 32]
const MID_GRAY = [92, 95, 101]

const colorToRgb = (
  color,
  fallback,
) => {
  const match = String(color).match(
    /^#([0-9a-f]{6})$/i,
  )
  if (!match) return fallback
  const value = Number.parseInt(
    match[1],
    16,
  )
  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ]
}
const PAGE = {
  width: 215.9,
  left: 15,
  right: 201,
  footerLineY: 262,
}

const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0))

const formatDate = (value) => {
  if (!value) {
    return 'Sin fecha'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date)
}

const imageUrlToDataUrl = async (url) => {
  const response = await fetch(url)
  const blob = await response.blob()

  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = () =>
        resolve(reader.result)
      reader.readAsDataURL(blob)
    },
  )
}

const addGoldRule = (document, y) => {
  document.setDrawColor(...GOLD)
  document.setLineWidth(0.7)
  document.line(
    PAGE.left,
    y,
    PAGE.right,
    y,
  )
}

const addFooter = (document) => {
  addGoldRule(
    document,
    PAGE.footerLineY,
  )

  const columns = [
    {
      x: PAGE.left,
      title: 'Responsable',
      value: COMPANY.responsible,
    },
    {
      x: 67,
      title: 'Teléfono',
      value: COMPANY.phone,
    },
    {
      x: 116,
      title: 'Correo',
      value: COMPANY.email,
    },
    {
      x: 163,
      title: 'Ubicación',
      value: COMPANY.location,
    },
  ]

  columns.forEach((column) => {
    document.setFillColor(...GOLD)
    document.circle(
      column.x,
      267,
      0.8,
      'F',
    )
    document.setFont(
      'helvetica',
      'bold',
    )
    document.setFontSize(6.7)
    document.setTextColor(...GRAPHITE)
    document.text(
      column.title,
      column.x + 3,
      267.5,
    )
    document.setFont(
      'helvetica',
      'normal',
    )
    document.setFontSize(6.2)
    document.setTextColor(...MID_GRAY)
    document.text(
      column.value,
      column.x + 3,
      271.4,
    )
  })
}

const addHeader = (
  document,
  service,
  logo,
) => {
  if (logo) {
    document.addImage(
      logo,
      'PNG',
      PAGE.left,
      15,
      78,
      19,
      undefined,
      'FAST',
    )
  } else {
    document.setFont(
      'helvetica',
      'bold',
    )
    document.setFontSize(19)
    document.setTextColor(...GRAPHITE)
    document.text(
      'AMPERIUM',
      PAGE.left,
      25,
    )
  }

  document.setFont('helvetica', 'bold')
  document.setFontSize(16)
  document.setTextColor(...GRAPHITE)
  document.text(
    'SERVICIO',
    PAGE.right,
    18,
    { align: 'right' },
  )

  document.setFontSize(7.2)
  document.text(
    'NO.',
    151,
    27,
    { align: 'right' },
  )
  document.setFont(
    'helvetica',
    'normal',
  )
  document.text(
    service.folio || 'SIN GUARDAR',
    PAGE.right,
    27,
    { align: 'right' },
  )
  document.setFont(
    'helvetica',
    'bold',
  )
  document.text(
    'FECHA:',
    151,
    34,
    { align: 'right' },
  )
  document.setFont(
    'helvetica',
    'normal',
  )
  document.text(
    formatDate(
      service.completedAt ||
        service.scheduledDate ||
        new Date(),
    ),
    PAGE.right,
    34,
    { align: 'right' },
  )

  addGoldRule(document, 49)
}

const addSummary = (
  document,
  service,
) => {
  document.setFont(
    'helvetica',
    'bold',
  )
  document.setFontSize(8)
  document.setTextColor(...GOLD)
  document.text(
    'DATOS DEL SERVICIO',
    PAGE.left,
    59,
  )

  const rows = [
    [
      'Cliente',
      service.clientName ||
        'Sin especificar',
      'Cotización',
      service.originQuotationFolio ||
        'Servicio directo',
    ],
    [
      'Proyecto',
      service.title || 'Servicio',
      'Programación',
      `${service.scheduledDate || 'Sin fecha'} ${service.scheduledTime || ''}`.trim(),
    ],
    [
      'Ubicación',
      service.address ||
        'Sin especificar',
      'Responsable',
      service.assignedTo ||
        COMPANY.responsible,
    ],
  ]

  autoTable(document, {
    startY: 64,
    body: rows,
    theme: 'plain',
    margin: {
      left: PAGE.left,
      right:
        PAGE.width - PAGE.right,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.4,
      textColor: GRAPHITE,
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        cellWidth: 24,
      },
      1: { cellWidth: 66 },
      2: {
        fontStyle: 'bold',
        cellWidth: 24,
      },
      3: { cellWidth: 72 },
    },
  })

  return document.lastAutoTable.finalY + 8
}

export const generateServicePdf = async (
  service,
) => {
  const configuration =
    await getConfiguration()
  Object.assign(COMPANY, {
    responsible:
      configuration.responsibleName,
    phone: configuration.phone,
    email: configuration.email,
    location: configuration.address,
  })
  GOLD.splice(
    0,
    3,
    ...colorToRgb(
      configuration.primaryColor,
      GOLD,
    ),
  )
  GRAPHITE.splice(
    0,
    3,
    ...colorToRgb(
      configuration.secondaryColor,
      GRAPHITE,
    ),
  )

  const logo =
    await imageUrlToDataUrl(
      configuration.logoUrl ||
        logoUrl,
    ).catch(() => null)
  const document = new jsPDF({
    unit: 'mm',
    format: 'letter',
  })

  addHeader(document, service, logo)
  let y = addSummary(document, service)

  document.setFont(
    'helvetica',
    'bold',
  )
  document.setFontSize(8)
  document.setTextColor(...GOLD)
  document.text(
    'TRABAJO REALIZADO',
    PAGE.left,
    y,
  )

  autoTable(document, {
    startY: y + 4,
    head: [['Descripción']],
    body: [
      [
        service.description ||
          'Sin descripción.',
      ],
      ...(service.observations
        ? [[service.observations]]
        : []),
    ],
    margin: {
      left: PAGE.left,
      right:
        PAGE.width - PAGE.right,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
    },
    headStyles: {
      fillColor: GRAPHITE,
      textColor: [255, 255, 255],
    },
  })

  y = document.lastAutoTable.finalY + 8

  if (service.expenses?.length) {
    document.setFont(
      'helvetica',
      'bold',
    )
    document.setFontSize(8)
    document.setTextColor(...GOLD)
    document.text(
      'EXTRAS Y MATERIALES',
      PAGE.left,
      y,
    )

    autoTable(document, {
      startY: y + 4,
      head: [
        [
          'Concepto adicional',
          'Fecha',
          'Importe',
        ],
      ],
      body: service.expenses.map(
        (expense) => [
          expense.description,
          expense.date || '',
          money(expense.amount),
        ],
      ),
      margin: {
        left: PAGE.left,
        right:
          PAGE.width - PAGE.right,
        bottom: 36,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: GOLD,
        textColor: GRAPHITE,
      },
      columnStyles: {
        2: {
          halign: 'right',
          cellWidth: 38,
        },
      },
    })

    y = document.lastAutoTable.finalY + 8
  }

  const extrasSubtotal = Number(
    service.extrasSubtotal ??
      service.expenses?.reduce(
        (total, expense) =>
          total +
          Number(expense.amount || 0),
        0,
      ) ??
      0,
  )
  const extrasTax = Number(
    service.extrasTax ??
      (service.extraTaxEnabled
        ? extrasSubtotal * 0.16
        : 0),
  )
  const finalTotal = Number(
    service.finalTotal ||
      Number(service.quotedTotal || 0) +
        extrasSubtotal +
        extrasTax,
  )
  const pending = Math.max(
    0,
    finalTotal -
      Number(service.paidAmount || 0),
  )

  if (y > 215) {
    document.addPage()
    addHeader(document, service, logo)
    y = 62
  }

  autoTable(document, {
    startY: y,
    body: [
      [
        'Importe original',
        money(service.quotedTotal),
      ],
      [
        'Extras',
        money(extrasSubtotal),
      ],
      ...(extrasTax > 0
        ? [['IVA extras (16%)', money(extrasTax)]]
        : []),
      ['TOTAL FINAL', money(finalTotal)],
      [
        'Pagado',
        money(service.paidAmount),
      ],
      ['Pendiente', money(pending)],
    ],
    theme: 'grid',
    margin: {
      left: 111,
      right:
        PAGE.width - PAGE.right,
      bottom: 36,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: GRAPHITE,
    },
    columnStyles: {
      1: {
        halign: 'right',
        fontStyle: 'bold',
      },
    },
    didParseCell: (data) => {
      if (
        data.row.index ===
        (extrasTax > 0 ? 3 : 2)
      ) {
        data.cell.styles.fillColor =
          GRAPHITE
        data.cell.styles.textColor =
          GOLD
        data.cell.styles.fontStyle =
          'bold'
      }
    },
  })

  const totalPages =
    document.getNumberOfPages()

  for (
    let page = 1;
    page <= totalPages;
    page += 1
  ) {
    document.setPage(page)
    addFooter(document)
    document.setFontSize(6)
    document.setTextColor(...MID_GRAY)
    document.text(
      `${page}/${totalPages}`,
      PAGE.width / 2,
      274.5,
      { align: 'center' },
    )
  }

  document.save(
    `${service.folio || 'servicio'}.pdf`,
  )
}
