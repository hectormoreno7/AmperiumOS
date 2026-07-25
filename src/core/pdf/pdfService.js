const requireBrowser = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('La generación del PDF requiere ejecutarse en el navegador.')
  }
}

export const openPrintView = ({ title = 'Documento', html = '' }) => {
  requireBrowser()

  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    throw new Error('El navegador bloqueó la ventana de impresión.')
  }

  printWindow.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body>${html}</body>
</html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()

  return printWindow
}

export const downloadBlob = (blob, fileName) => {
  requireBrowser()

  if (!(blob instanceof Blob)) {
    throw new Error('El contenido recibido no es un archivo válido.')
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName || 'documento.pdf'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
