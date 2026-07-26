import {
    ChevronRight,
    MapPin,
    Phone,
} from "lucide-react";

import styles from "./ClientCard.module.css";

function getClientName(client) {
    return client?.name || client?.nombre || "Cliente sin nombre";
}

function getClientPhone(client) {
    return (
        client?.phones?.find(Boolean) ||
        client?.telefonos?.find(Boolean) ||
        client?.phone ||
        client?.telefono ||
        ""
    );
}

function getClientAddress(client) {
    return client?.address || client?.direccion || "";
}

function getClientReference(client) {
    return (
        client?.reference ||
        client?.contact ||
        client?.empresa ||
        client?.email ||
        "Sin referencia adicional"
    );
}

function isClientActive(client) {
    if (typeof client?.active === "boolean") {
        return client.active;
    }

    if (typeof client?.activo === "boolean") {
        return client.activo;
    }

    return client?.status !== "inactive" && client?.estado !== "inactivo";
}

export default function ClientCard({
    client,
    quotationCount = 0,
    serviceCount = 0,
    noteCount = 0,
    onDetails,
}) {
    const name = getClientName(client);
    const phone = getClientPhone(client);
    const address = getClientAddress(client);
    const reference = getClientReference(client);
    const active = isClientActive(client);

    const callClient = (event) => {
        event.stopPropagation();

        if (!phone) {
            return;
        }

        window.location.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
    };

    const openMaps = (event) => {
        event.stopPropagation();

        if (!address) {
            return;
        }

        window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                address
            )}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    const openDetails = () => {
        onDetails?.(client);
    };

    return (
        <article className={styles.card}>
            <div className={styles.main}>
                <div className={styles.heading}>
                    <div className={styles.identity}>
                        <h3 className={styles.name}>{name}</h3>

                        <span
                            className={`${styles.status} ${
                                active ? styles.active : styles.inactive
                            }`}
                        >
                            {active ? "Activo" : "Inactivo"}
                        </span>
                    </div>

                    <p className={styles.reference}>{reference}</p>

                    {phone ? (
                        <p className={styles.phone}>{phone}</p>
                    ) : (
                        <p className={styles.muted}>Sin teléfono registrado</p>
                    )}
                </div>

                <div className={styles.history}>
                    <span>{quotationCount} cot.</span>
                    <span>{serviceCount} serv.</span>
                    <span>{noteCount} notas</span>
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.quickActions}>
                    <button
                        type="button"
                        className={styles.iconButton}
                        onClick={callClient}
                        disabled={!phone}
                        title={phone ? "Llamar" : "Sin teléfono"}
                        aria-label="Llamar al cliente"
                    >
                        <Phone size={17} strokeWidth={1.8} />
                    </button>

                    <button
                        type="button"
                        className={styles.iconButton}
                        onClick={openMaps}
                        disabled={!address}
                        title={address ? "Abrir ubicación" : "Sin dirección"}
                        aria-label="Abrir ubicación del cliente"
                    >
                        <MapPin size={17} strokeWidth={1.8} />
                    </button>
                </div>

                <button
                    type="button"
                    className={styles.detailsButton}
                    onClick={openDetails}
                >
                    Ver detalles
                    <ChevronRight size={16} strokeWidth={1.8} />
                </button>
            </div>
        </article>
    );
}
