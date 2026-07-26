import ClientHeader from "./ClientHeader";
import ClientSummary from "./ClientSummary";
import ClientInfo from "./ClientInfo";
import ClientQuotationHistory from "./ClientQuotationHistory";

import styles from "./ClientDetails.module.css";

export default function ClientDetails({
    client,
    quotations = [],
    services = [],
    notes = [],
    onEdit,
    onDelete,
    onOpenQuotation,
    onOpenService,
    onOpenNote,
}) {
    if (!client) {
        return (
            <section className={styles.empty}>
                <h2>Selecciona un cliente</h2>

                <p>
                    Aquí aparecerá todo su historial.
                </p>
            </section>
        );
    }

    return (
        <section className={styles.container}>
            <ClientHeader
                client={client}
                onEdit={onEdit}
                onDelete={onDelete}
            />

            <ClientSummary
                client={client}
                quotations={quotations}
                services={services}
                notes={notes}
            />

            <ClientInfo client={client} />

            <ClientQuotationHistory
                quotations={quotations}
                onOpenQuotation={onOpenQuotation}
            />

            {services.length > 0 ? (
                <section className={styles.historySection}>
                    <div className={styles.historyHeader}>
                        <div>
                            <h3>Servicios</h3>

                            <p>
                                Historial de servicios del cliente
                            </p>
                        </div>

                        <span>{services.length}</span>
                    </div>

                    <div className={styles.historyList}>
                        {services.map((service) => (
                            <button
                                type="button"
                                key={
                                    service.id ||
                                    service.serviceId ||
                                    service.folio
                                }
                                className={styles.historyItem}
                                onClick={() =>
                                    onOpenService?.(service)
                                }
                            >
                                <div>
                                    <strong>
                                        {service.folio ||
                                            "Servicio sin folio"}
                                    </strong>

                                    <span>
                                        {service.title ||
                                            service.serviceName ||
                                            service.nombre ||
                                            service.description ||
                                            "Servicio"}
                                    </span>
                                </div>

                                <span>Ver</span>
                            </button>
                        ))}
                    </div>
                </section>
            ) : null}

            {notes.length > 0 ? (
                <section className={styles.historySection}>
                    <div className={styles.historyHeader}>
                        <div>
                            <h3>Notas</h3>

                            <p>
                                Historial de notas del cliente
                            </p>
                        </div>

                        <span>{notes.length}</span>
                    </div>

                    <div className={styles.historyList}>
                        {notes.map((note) => (
                            <button
                                type="button"
                                key={
                                    note.id ||
                                    note.noteId ||
                                    note.folio
                                }
                                className={styles.historyItem}
                                onClick={() =>
                                    onOpenNote?.(note)
                                }
                            >
                                <div>
                                    <strong>
                                        {note.folio ||
                                            "Nota sin folio"}
                                    </strong>

                                    <span>
                                        {note.title ||
                                            note.concept ||
                                            note.description ||
                                            "Nota"}
                                    </span>
                                </div>

                                <span>Ver</span>
                            </button>
                        ))}
                    </div>
                </section>
            ) : null}
        </section>
    );
}
