import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoSimpleUrl from '../../../assets/branding/logos/logo-horizontal-simple.png'
import isotipoUrl from '../../../assets/branding/logos/isotipo.png'
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
const LIGHT_GRAY = [224, 225, 228]

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
  height: 279.4,
  left: 11,
  right: 204.9,
  contentWidth: 193.9,
  footerLineY: 262,
}

const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))

const splitLines = (value) =>
  String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

const formatDate = (value = new Date()) =>
  new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value instanceof Date ? value : new Date(value))

const addDays = (value, days) => {
  const date =
    value instanceof Date
      ? new Date(value)
      : new Date(value || Date.now())

  date.setDate(date.getDate() + days)

  return date
}

const imageUrlToDataUrl = async (url) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`No fue posible cargar el recurso: ${url}`)
  }

  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)

    reader.onerror = () =>
      reject(new Error('No fue posible convertir la imagen.'))

    reader.readAsDataURL(blob)
  })
}

const removeWhiteImageBackground = (
  source,
) =>
  new Promise((resolve) => {
    if (!source) {
      resolve(source)
      return
    }

    const image = new Image()

    image.onerror = () =>
      resolve(source)

    image.onload = () => {
      const canvas =
        document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height

      const context =
        canvas.getContext('2d')
      context.drawImage(image, 0, 0)

      const pixels =
        context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        )

      for (
        let index = 0;
        index < pixels.data.length;
        index += 4
      ) {
        if (
          pixels.data[index] > 245 &&
          pixels.data[index + 1] > 245 &&
          pixels.data[index + 2] > 245
        ) {
          pixels.data[index + 3] = 0
        }
      }

      context.putImageData(
        pixels,
        0,
        0,
      )
      resolve(
        canvas.toDataURL('image/png'),
      )
    }

    image.src = source
  })

const addImageContained = (
  doc,
  image,
  format,
  x,
  y,
  maxWidth,
  maxHeight,
  align = 'left',
) => {
  if (!image) return

  try {
    const properties = doc.getImageProperties(image)

    const scale = Math.min(
      maxWidth / properties.width,
      maxHeight / properties.height,
    )

    const width = properties.width * scale
    const height = properties.height * scale

    let finalX = x

    if (align === 'center') {
      finalX = x + (maxWidth - width) / 2
    }

    if (align === 'right') {
      finalX = x + maxWidth - width
    }

    const finalY = y + (maxHeight - height) / 2

    doc.addImage(
      image,
      format,
      finalX,
      finalY,
      width,
      height,
      undefined,
      'FAST',
    )
  } catch {
    // El logo no debe impedir la generación del PDF.
  }
}

const addWatermark = (doc, isotipo) => {
  if (!isotipo) return

  try {
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.045 }))

    addImageContained(
      doc,
      isotipo,
      'PNG',
      31,
      67,
      154,
      154,
      'center',
    )

    doc.restoreGraphicsState()
  } catch {
    // La marca de agua no debe impedir la creación del PDF.
  }
}

const addGoldRule = (
  doc,
  y,
  width = PAGE.contentWidth,
  x = PAGE.left,
) => {
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1)
  doc.line(x, y, x + width, y)
}

const addFooter = (doc) => {
  addGoldRule(doc, PAGE.footerLineY)

  const columns = [
    {
      x: PAGE.left,
      title: COMPANY.responsible,
      value: 'Servicios de ingeniería',
      align: 'left',
    },
    {
      x: 70,
      title: 'Teléfono',
      value: COMPANY.phone,
      align: 'left',
    },
    {
      x: 116,
      title: 'Correo',
      value: COMPANY.email,
      align: 'left',
    },
    {
      x: PAGE.right,
      title: 'Ubicación',
      value: COMPANY.location,
      align: 'right',
    },
  ]

  columns.forEach((column) => {
    const dotX =
      column.align === 'right'
        ? column.x - 38
        : column.x

    doc.setFillColor(...GOLD)
    doc.circle(dotX, 267, 0.8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.7)
    doc.setTextColor(...GRAPHITE)
    doc.text(column.title, dotX + 3, 267.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.2)
    doc.setTextColor(...MID_GRAY)
    doc.text(column.value, dotX + 3, 271.4)
  })
}

const addPageNumber = (doc, current, total) => {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...MID_GRAY)

  doc.text(
    `${current}/${total}`,
    PAGE.width / 2,
    274.5,
    {
      align: 'center',
    },
  )
}

const addPageOneHeader = (
  doc,
  quotation,
  assets,
) => {
  addWatermark(doc, assets.isotipo)

  if (assets.logo) {
    addImageContained(
      doc,
      assets.logo,
      'PNG',
      PAGE.left,
      16,
      80,
      20,
      'left',
    )
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...GRAPHITE)

  doc.text(
    'COTIZACIÓN',
    PAGE.right,
    18,
    {
      align: 'right',
    },
  )

  const issuedAt =
    quotation.issuedAt || new Date()

  const validUntil =
    quotation.validUntil ||
    addDays(issuedAt, 10)

  const rows = [
    [
      'NO.',
      quotation.folio || 'SIN GUARDAR',
    ],
    [
      'FECHA:',
      formatDate(issuedAt),
    ],
    [
      'VÁLIDA HASTA:',
      formatDate(validUntil),
    ],
  ]

  let y = 26

  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.2)
    doc.setTextColor(...GRAPHITE)

    doc.text(
      label,
      151,
      y,
      {
        align: 'right',
      },
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.2)

    doc.text(
      String(value),
      PAGE.right,
      y,
      {
        align: 'right',
      },
    )

    y += 6
  })

  addGoldRule(doc, 55)
}

const labelValue = (
  doc,
  label,
  value,
  xLabel,
  xValue,
  y,
  maxWidth = 65,
) => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.4)
  doc.setTextColor(...GRAPHITE)

  doc.text(label, xLabel, y)

  doc.setFont('helvetica', 'normal')

  const wrapped = doc.splitTextToSize(
    String(value || ''),
    maxWidth,
  )

  doc.text(wrapped, xValue, y)

  return wrapped.length
}

const addClientProject = (
  doc,
  quotation,
) => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...GOLD)

  doc.text(
    'DATOS DEL CLIENTE',
    PAGE.left,
    65,
  )

  doc.text(
    'DATOS DEL PROYECTO',
    111,
    65,
  )

  doc.setDrawColor(...LIGHT_GRAY)
  doc.setLineWidth(0.45)

  doc.line(
    106,
    61.5,
    106,
    86,
  )

  const clientRows = [
    [
      'CLIENTE:',
      quotation.clientName,
    ],
    [
      'TELÉFONO:',
      quotation.phone,
    ],
    [
      'CORREO:',
      quotation.email,
    ],
    [
      'DIRECCIÓN:',
      quotation.address,
    ],
  ]

  const projectRows = [
    [
      'PROYECTO:',
      quotation.projectName,
    ],
    [
      'UBICACIÓN:',
      quotation.projectLocation ||
        quotation.location,
    ],
  ]

  let clientY = 71

  clientRows.forEach(([label, value]) => {
    const lines = labelValue(
      doc,
      label,
      value,
      PAGE.left,
      41,
      clientY,
      61,
    )

    clientY += Math.max(1, lines) * 5.3
  })

  let projectY = 71

  projectRows.forEach(([label, value]) => {
    const lines = labelValue(
      doc,
      label,
      value,
      111,
      141,
      projectY,
      62,
    )

    projectY += Math.max(1, lines) * 5.3
  })

  const descriptionY = Math.max(clientY, projectY) + 3
  const description = doc.splitTextToSize(
    quotation.summary || quotation.description || '',
    PAGE.contentWidth,
  )

  if (!description.length) {
    return descriptionY + 3
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.4)
  doc.setTextColor(...GRAPHITE)
  doc.text('DESCRIPCIÓN:', PAGE.left, descriptionY)
  doc.setFont('helvetica', 'normal')
  doc.text(description, PAGE.left, descriptionY + 5)

  return descriptionY + 5 + description.length * 3.7 + 4
}

const getCommercialConditions = (quotation) => [
  ['FORMA DE PAGO:', quotation.paymentMethod || 'Transferencia'],
  [
    'ANTICIPO:',
    `${quotation.advanceRate || 0}% (${money(
      quotation.totals?.advanceAmount,
    )})`,
  ],
  ['RESTANTE:', quotation.remainingTerms || 'Contra entrega'],
  ['ENTREGA:', quotation.deliveryTime || 'Por definir'],
  ['GARANTÍA:', quotation.warranty || 'Según equipo e instalación'],
  ['VALIDEZ:', '10 días naturales'],
  ['MONEDA:', 'Pesos Mexicanos MXN'],
]

const getCommercialConditionsHeight = (doc, quotation) =>
  10 + getCommercialConditions(quotation).reduce(
    (height, [, value]) =>
      height +
      Math.max(
        1,
        doc.splitTextToSize(String(value || ''), 61).length,
      ) * 5.1,
    0,
  )

const addCommercialConditions = (
  doc,
  quotation,
  y,
) => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...GOLD)

  doc.text(
    'CONDICIONES COMERCIALES',
    PAGE.left,
    y,
  )

  let rowY = y + 7

  getCommercialConditions(quotation).forEach(([label, value]) => {
    const lines = labelValue(
      doc,
      label,
      value,
      PAGE.left,
      47,
      rowY,
      61,
    )

    rowY += Math.max(1, lines) * 5.1
  })

  return rowY
}

const addTotals = (
  doc,
  quotation,
  y,
) => {
  const x = 145
  const width = 59

  const rows = [
    [
      'SUBTOTAL',
      money(quotation.totals?.subtotal),
    ],
    [
      'IVA 16%',
      money(quotation.totals?.tax),
    ],
    [
      'TOTAL',
      money(quotation.totals?.total),
    ],
  ]

  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.55)

  doc.rect(
    x,
    y,
    width,
    27,
    'S',
  )

  rows.forEach(([label, value], index) => {
    const rowY =
      y + 7 + index * 8

    const isTotal =
      index === 2

    if (isTotal) {
      doc.setDrawColor(...GOLD)
      doc.setLineWidth(0.45)

      doc.line(
        x + 4,
        rowY - 5,
        x + width - 4,
        rowY - 5,
      )
    }

    doc.setFont(
      'helvetica',
      isTotal ? 'bold' : 'normal',
    )

    doc.setFontSize(
      isTotal ? 10.5 : 7.5,
    )

    doc.setTextColor(
      ...(isTotal
        ? GOLD
        : GRAPHITE),
    )

    doc.text(
      label,
      x + 4,
      rowY,
    )

    doc.text(
      value,
      x + width - 4,
      rowY,
      {
        align: 'right',
      },
    )
  })
}

const addConceptPhotoAnnex = (
  doc,
  quotation,
  assets,
) => {
  const items = (quotation.items || []).filter((item) => item.image)
  if (!items.length) return

  let y = 61
  doc.addPage()
  addPageTwoHeader(doc, quotation, assets)

  items.forEach((item, index) => {
    const blockHeight = 82
    if (y + blockHeight > 250) {
      addFooter(doc)
      doc.addPage()
      addPageTwoHeader(doc, quotation, assets)
      y = 61
    }

    if (y === 61) {
      addGoldTitle(doc, 'ANEXO FOTOGRÁFICO DE CONCEPTOS', PAGE.left, y)
      y += 9
    }

    doc.setDrawColor(...LIGHT_GRAY)
    doc.setLineWidth(0.35)
    doc.roundedRect(PAGE.left, y, PAGE.contentWidth, blockHeight - 5, 2, 2, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...GRAPHITE)
    const description = doc.splitTextToSize(
      `${index + 1}. ${item.description || 'Concepto'}`,
      105,
    )
    doc.text(description, 94, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.2)
    doc.setTextColor(...MID_GRAY)
    doc.text(`Cantidad: ${item.quantity || 0} ${item.unit || ''}`, 94, y + 23)
    doc.text(`Precio unitario: ${money(item.unitPrice)}`, 94, y + 29)
    try {
      const properties = doc.getImageProperties(item.image)
      addImageContained(doc, item.image, properties.fileType || 'JPEG', PAGE.left + 4, y + 4, 74, 67, 'center')
    } catch {
      doc.setFontSize(7)
      doc.text('No fue posible cargar la foto.', PAGE.left + 41, y + 38, { align: 'center' })
    }
    y += blockHeight
  })

  addFooter(doc)
}

const addPageTwoHeader = (
  doc,
  quotation,
  assets,
) => {
  addWatermark(doc, assets.isotipo)

  if (assets.logo) {
    addImageContained(
      doc,
      assets.logo,
      'PNG',
      PAGE.left,
      16,
      80,
      20,
      'left',
    )
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...GRAPHITE)

  doc.text(
    'TÉRMINOS Y CONDICIONES',
    PAGE.right,
    18,
    {
      align: 'right',
    },
  )

  addGoldRule(doc, 52)
}

const addGoldTitle = (
  doc,
  title,
  x,
  y,
) => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.3)
  doc.setTextColor(...GOLD)

  doc.text(title, x, y)
}

const addBulletList = (
  doc,
  text,
  x,
  y,
  width,
  numbered = false,
  fontSize = 7.3,
  lineHeight = 4.1,
) => {
  const lines = splitLines(text)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(fontSize)
  doc.setTextColor(...GRAPHITE)

  let currentY = y

  lines.forEach((line, index) => {
    const prefix = numbered
      ? `${index + 1}. `
      : '• '

    const wrapped =
      doc.splitTextToSize(
        `${prefix}${line}`,
        width,
      )

    doc.text(
      wrapped,
      x,
      currentY,
    )

    currentY +=
      wrapped.length * lineHeight
  })

  return currentY
}

const addProjectImage = (
  doc,
  quotation,
  y,
) => {
  if (!quotation.diagramImage) {
    return y
  }

  addGoldTitle(
    doc,
    'ESQUEMA DEL PROYECTO',
    PAGE.left,
    y,
  )

  const boxY = y + 5
  const boxHeight = 61

  doc.setDrawColor(...LIGHT_GRAY)
  doc.setLineWidth(0.35)
  doc.setLineDashPattern(
    [1.3, 1.3],
    0,
  )

  doc.rect(
    PAGE.left,
    boxY,
    PAGE.contentWidth,
    boxHeight,
    'S',
  )

  doc.setLineDashPattern([], 0)

  try {
    const properties =
      doc.getImageProperties(
        quotation.diagramImage,
      )

    const maxWidth =
      PAGE.contentWidth - 8

    const maxHeight =
      boxHeight - 8

    const scale = Math.min(
      maxWidth / properties.width,
      maxHeight / properties.height,
    )

    const width =
      properties.width * scale

    const height =
      properties.height * scale

    doc.addImage(
      quotation.diagramImage,
      properties.fileType || 'JPEG',
      PAGE.left +
        (PAGE.contentWidth - width) / 2,
      boxY +
        (boxHeight - height) / 2,
      width,
      height,
      undefined,
      'FAST',
    )
  } catch {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.3)
    doc.setTextColor(...MID_GRAY)

    doc.text(
      'No fue posible integrar la imagen.',
      PAGE.width / 2,
      boxY + 31,
      {
        align: 'center',
      },
    )
  }

  return boxY + boxHeight + 7
}

const addSignatures = (
  doc,
  quotation,
  signatureY = 236,
) => {
  const y = signatureY
  const leftX = 15
  const rightX = 118
  const width = 82

  const signature = (
    image,
    x,
    title,
    subtitle,
  ) => {
    if (image) {
      try {
        addImageContained(
          doc,
          image,
          'PNG',
          x + 10,
          y - 22,
          width - 20,
          19,
          'center',
        )
      } catch {
        // Firma opcional.
      }
    }

    doc.setDrawColor(...GRAPHITE)
    doc.setLineWidth(0.35)

    doc.line(
      x,
      y,
      x + width,
      y,
    )

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...GRAPHITE)

    doc.text(
      title,
      x + width / 2,
      y + 7,
      {
        align: 'center',
      },
    )

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MID_GRAY)

    doc.text(
      subtitle,
      x + width / 2,
      y + 13,
      {
        align: 'center',
      },
    )
  }

  signature(
    quotation.clientSignature,
    leftX,
    'Firma cliente',
    quotation.clientName ||
      'Nombre y fecha',
  )

  signature(
    quotation.responsibleSignature,
    rightX,
    'Firma responsable Amperium',
    quotation.responsibleName ||
      COMPANY.responsible,
  )
}

export const generateQuotationPdf = async (
  quotation,
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

  const [logo, isotipo] =
    await Promise.all([
      imageUrlToDataUrl(
        configuration.logoUrl ||
          logoSimpleUrl,
      ).catch(() => null),

      imageUrlToDataUrl(
        isotipoUrl,
      ).catch(() => null),
    ])

  const [
    clientSignature,
    responsibleSignature,
  ] = await Promise.all([
    removeWhiteImageBackground(
      quotation.clientSignature,
    ),
    removeWhiteImageBackground(
      quotation.responsibleSignature,
    ),
  ])

  quotation = {
    ...quotation,
    clientSignature,
    responsibleSignature,
  }

  const assets = {
    logo,
    isotipo,
  }

  const doc = new jsPDF({
    unit: 'mm',
    format: 'letter',
    compress: true,
  })

  addPageOneHeader(
    doc,
    quotation,
    assets,
  )

  const tableStartY = addClientProject(
    doc,
    quotation,
  )

  autoTable(doc, {
    startY: Math.max(92, tableStartY),

    head: [
      [
        'PARTIDA',
        'CANT',
        'DESCRIPCIÓN',
        'UNIDAD',
        'P. UNITARIO',
        'IMPORTE',
      ],
    ],

    body: (
      quotation.items || []
    ).map((item, index) => [
      index + 1,

      Number(
        item.quantity || 0,
      ),

      item.description || '',

      String(
        item.unit || '',
      ).toUpperCase(),

      money(
        item.unitPrice,
      ),

      money(
        Number(
          item.quantity || 0,
        ) *
          Number(
            item.unitPrice || 0,
          ),
      ),
    ]),

    theme: 'plain',

    margin: {
      left: PAGE.left,
      right: 11,
      bottom: 34,
    },

    styles: {
      font: 'helvetica',
      fontSize: 7.2,

      cellPadding: {
        top: 2.3,
        right: 1.5,
        bottom: 2.3,
        left: 1.5,
      },

      textColor: GRAPHITE,
      lineColor: LIGHT_GRAY,

      lineWidth: {
        bottom: 0.25,
      },

      valign: 'middle',
    },

    headStyles: {
      fillColor: GOLD,
      textColor: GRAPHITE,
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0,
    },

    columnStyles: {
      0: {
        cellWidth: 17,
        halign: 'center',
      },

      1: {
        cellWidth: 16,
        halign: 'center',
      },

      2: {
        cellWidth: 82,
      },

      3: {
        cellWidth: 20,
        halign: 'center',
      },

      4: {
        cellWidth: 28,
        halign: 'right',
      },

      5: {
        cellWidth: 31,
        halign: 'right',
      },
    },

    didDrawPage: () => {
      addWatermark(
        doc,
        assets.isotipo,
      )

      addFooter(doc)
    },
  })

  // Las condiciones y los totales acompañan al último concepto cuando hay
  // espacio. Solo se abre una página adicional si ese bloque completo no cabe.
  const lastConceptY = doc.lastAutoTable.finalY
  const conditionsHeight = getCommercialConditionsHeight(
    doc,
    quotation,
  )
  let contentY = lastConceptY + 8

  if (
    contentY + conditionsHeight >
    PAGE.footerLineY - 3
  ) {
    doc.addPage()
    addPageTwoHeader(doc, quotation, assets)
    contentY = 61
  }

  addCommercialConditions(
    doc,
    quotation,
    contentY,
  )

  addTotals(
    doc,
    quotation,
    contentY - 3,
  )

  addConceptPhotoAnnex(doc, quotation, assets)

  doc.addPage()

  addPageTwoHeader(
    doc,
    quotation,
    assets,
  )

  let y = 61

  addGoldTitle(
    doc,
    'RESUMEN EJECUTIVO',
    PAGE.left,
    y,
  )

  doc.setFont(
    'helvetica',
    'normal',
  )

  doc.setFontSize(7.5)
  doc.setTextColor(...GRAPHITE)

  const summary =
    doc.splitTextToSize(
      quotation.summary ||
        quotation.description ||
        'Sin resumen ejecutivo.',
      PAGE.contentWidth,
    )

  doc.text(
    summary,
    PAGE.left,
    y + 6,
  )

  y +=
    summary.length * 4 + 11

  y = addProjectImage(
    doc,
    quotation,
    y,
  )

  const listsTop = y

  addGoldTitle(
    doc,
    'ALCANCE INCLUIDO',
    PAGE.left,
    listsTop,
  )

  addGoldTitle(
    doc,
    'EXCLUSIONES',
    111,
    listsTop,
  )

  const includedEnd =
    addBulletList(
      doc,
      quotation.includedScope,
      PAGE.left + 2,
      listsTop + 7,
      86,
    )

  const exclusionsText = [
    quotation.excludedScope,
    quotation.exclusions,
  ]
    .filter(Boolean)
    .join('\n')

  const exclusionsEnd =
    addBulletList(
      doc,
      exclusionsText,
      113,
      listsTop + 7,
      87,
    )

  const conditionsTop =
    Math.max(
      includedEnd,
      exclusionsEnd,
    ) + 5

  addGoldTitle(
    doc,
    'CONDICIONES GENERALES',
    PAGE.left,
    conditionsTop,
  )

  addBulletList(
    doc,
    quotation.generalConditions,
    PAGE.left + 2,
    conditionsTop + 7,
    188,
    true,
    6.2,
    3.25,
  )

  addSignatures(
    doc,
    quotation,
    241,
  )

  addFooter(doc)

  const totalPages =
    doc.getNumberOfPages()

  for (
    let page = 1;
    page <= totalPages;
    page += 1
  ) {
    doc.setPage(page)

    addFooter(doc)

    addPageNumber(
      doc,
      page,
      totalPages,
    )
  }

  const filename =
    `${
      quotation.folio ||
      'Cotizacion-borrador'
    }-${
      quotation.clientName ||
      'Cliente'
    }.pdf`.replace(
      /[^\w.-]+/g,
      '-',
    )

  doc.save(filename)
}
