import ClientCard from "./ClientCard";
import styles from "./ClientsGrid.module.css";

function matchesClient(record, client) {
    if (!record || !client) {
        return false;
    }

    const clientId =
        record.clientId ||
        record.clienteId ||
        record.customerId ||
        record.client?.id;

    if (clientId && client.id) {
        return clientId === client.id;
    }

    const recordName =
        record.clientName ||
        record.clienteNombre ||
        record.customerName ||
        record.client?.name ||
        "";

    const clientName = client.name || client.nombre || "";

    return (
        recordName &&
        clientName &&
        recordName.trim().toLowerCase() ===
            clientName.trim().toLowerCase()
    );
}

export default function ClientsGrid({
    clients = [],
    quotations = [],
    services = [],
    notes = [],
    onDetails,
    loading = false,
}) {
    if (loading) {
        return (
            <div className={styles.empty}>
                Cargando clientes...
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className={styles.empty}>
                No se encontraron clientes.
            </div>
        );
    }

    return (
        <section className={styles.grid}>
            {clients.map((client) => {
                const quotationCount = quotations.filter((quotation) =>
                    matchesClient(quotation, client)
                ).length;

                const serviceCount = services.filter((service) =>
                    matchesClient(service, client)
                ).length;

                const noteCount = notes.filter((note) =>
                    matchesClient(note, client)
                ).length;

                return (
                    <ClientCard
                        key={client.id}
                        client={client}
                        quotationCount={quotationCount}
                        serviceCount={serviceCount}
                        noteCount={noteCount}
                        onDetails={onDetails}
                    />
                );
            })}
        </section>
    );
}