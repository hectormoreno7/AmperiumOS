import {
    Phone,
    MessageCircle,
    Pencil,
    MapPin,
} from "lucide-react";

import styles from "./ClientHeader.module.css";

function getClientName(client) {
    return client?.name || client?.nombre || "Cliente sin nombre";
}

function getClientPhone(client) {
    return client?.phone || client?.telefono || "";
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

    return client?.status !== "inactive" &&
        client?.estado !== "inactivo";
}

export default function ClientHeader({
    client,
    onEdit,
}) {
    if (!client) {
        return null;
    }

    const name = getClientName(client);
    const phone = getClientPhone(client);
    const address = getClientAddress(client);
    const reference = getClientReference(client);
    const active = isClientActive(client);

    const callClient = () => {
        if (!phone) {
            return;
        }

        window.location.href = `tel:${phone}`;
    };

    const openWhatsApp = () => {
        if (!phone) {
            return;
        }

        const cleanPhone = phone.replace(/\D/g, "");
        const whatsappPhone = cleanPhone.startsWith("52")
            ? cleanPhone
            : `52${cleanPhone}`;

        window.open(
            `https://wa.me/${whatsappPhone}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    const openMaps = () => {
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

    return (
        <section className={styles.header}>
            <div className={styles.info}>
                <div className={styles.topRow}>
                    <h1 className={styles.name}>
                        {name}
                    </h1>

                    <span
                        className={`${styles.status} ${
                            active
                                ? styles.active
                                : styles.inactive
                        }`}
                    >
                        {active ? "Activo" : "Inactivo"}
                    </span>
                </div>

                <p className={styles.reference}>
                    {reference}
                </p>
            </div>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.actionButton}
                    onClick={callClient}
                    disabled={!phone}
                    title="Llamar"
                >
                    <Phone size={17} strokeWidth={1.8} />
                    <span>Llamar</span>
                </button>

                <button
                    type="button"
                    className={styles.actionButton}
                    onClick={openWhatsApp}
                    disabled={!phone}
                    title="WhatsApp"
                >
                    <MessageCircle
                        size={17}
                        strokeWidth={1.8}
                    />
                    <span>WhatsApp</span>
                </button>

                <button
                    type="button"
                    className={styles.actionButton}
                    onClick={openMaps}
                    disabled={!address}
                    title="Ubicación"
                >
                    <MapPin size={17} strokeWidth={1.8} />
                    <span>Ubicación</span>
                </button>

                <button
                    type="button"
                    className={styles.editButton}
                    onClick={onEdit}
                >
                    <Pencil size={16} strokeWidth={1.8} />
                    <span>Editar</span>
                </button>
            </div>
        </section>
    );
}