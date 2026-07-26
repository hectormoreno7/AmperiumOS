import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  subscribeToQuotations,
} from '../../cotizaciones/services/cotizacionesService'
import {
  subscribeToServices,
} from '../../servicios/services/serviciosService'
import styles from './HistorialPage.module.css'

const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0))

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()

function HistorialPage() {
  const [quotations, setQuotations] =
    useState([])
  const [services, setServices] =
    useState([])
  const [search, setSearch] =
    useState('')

  useEffect(() => {
    const unsubscribeQuotations =
      subscribeToQuotations(
        setQuotations,
      )
    const unsubscribeServices =
      subscribeToServices(setServices)

    return () => {
      unsubscribeQuotations()
      unsubscribeServices()
    }
  }, [])

  const records = useMemo(() => {
    const archivedQuotations =
      quotations
        .filter(
          (quotation) =>
            quotation.archived ||
            (
              !quotation.linkedServiceId &&
              quotation.financialStatus ===
                'liquidada'
            ),
        )
        .map((quotation) => ({
          id: `quotation-${quotation.id}`,
          module: 'Cotización',
          folio: quotation.folio,
          title:
            quotation.projectName,
          client:
            quotation.clientName,
          total:
            quotation.totals?.total,
          date:
            quotation.archivedAt ||
            quotation.updatedAt,
          href: `/cotizaciones?open=${encodeURIComponent(
            quotation.id,
          )}`,
        }))

    const archivedServices =
      services
        .filter(
          (service) =>
            service.archived ||
            (
              service.status ===
                'finalizado' &&
              service.financialStatus ===
                'liquidada'
            ),
        )
        .map((service) => ({
          id: `service-${service.id}`,
          module: 'Servicio',
          folio: service.folio,
          title: service.title,
          client: service.clientName,
          total:
            service.finalTotal ||
            service.quotedTotal,
          date:
            service.archivedAt ||
            service.completedAt ||
            service.updatedAt,
          href: `/servicios?open=${encodeURIComponent(
            service.id,
          )}`,
        }))

    const query = normalize(search)

    return [
      ...archivedQuotations,
      ...archivedServices,
    ]
      .filter((record) =>
        normalize(
          [
            record.module,
            record.folio,
            record.title,
            record.client,
          ].join(' '),
        ).includes(query),
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date),
      )
  }, [quotations, search, services])

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Buscar en todo el historial..."
        />

        <span>
          {records.length} registros
        </span>
      </div>

      <div className={styles.list}>
        {records.length ? (
          records.map((record) => (
            <article
              key={record.id}
              className={styles.card}
            >
              <div>
                <span>{record.module}</span>
                <strong>
                  {record.folio ||
                    'Sin folio'}
                </strong>
                <h2>
                  {record.title ||
                    'Sin título'}
                </h2>
                <p>{record.client}</p>
              </div>

              <div
                className={
                  styles.cardRight
                }
              >
                <strong>
                  {money(record.total)}
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    window.location.assign(
                      record.href,
                    )
                  }
                >
                  Abrir
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className={styles.empty}>
            Todavía no hay registros finalizados y liquidados.
          </div>
        )}
      </div>
    </section>
  )
}

export default HistorialPage
