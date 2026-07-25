import {
    ChevronRight,
    FileText,
} from "lucide-react";

import styles from "./ClientQuotationHistory.module.css";

const STATUS_LABELS = {
    draft: "Borrador",
    borrador: "Borrador",

    sent: "Enviada",
    enviada: "Enviada",

    accepted: "Aceptada",
    aceptada: "Aceptada",

    execution: "En ejecución",
    "en ejecución": "En ejecución",
    ejecucion: "En ejecución",

    finished: "Finalizada",
    finalizada: "Finalizada",

    cancelled: "Cancelada",
    cancelada: "Cancelada",
};

function getTimestamp(value) {
    if (!value) {
        return 0;
    }

    if (typeof value?.toDate === "function") {
        return value.toDate().getTime();
    }

    if (typeof value?.seconds === "number") {
        return value.seconds * 1000;
    }

    const parsedDate = new Date(value).getTime();

    return Number.isNaN(parsedDate)
        ? 0
        : parsedDate;
}

function formatDate(value) {
    const timestamp = getTimestamp(value);

    if (!timestamp) {
        return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(timestamp));
}

function formatCurrency(value) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
}

function getStatus(quotation) {
    const rawStatus = String(
        quotation?.status ||
        quotation?.estado ||
        "borrador"
    )
        .trim()
        .toLowerCase();

    return (
        STATUS_LABELS[rawStatus] ||
        quotation?.status ||
        quotation?.estado ||
        "Borrador"
    );
}

function getStatusClass(status) {
    const normalizedStatus = String(
        status || ""
    ).toLowerCase();

    if (
        normalizedStatus.includes("aceptada")
    ) {
        return styles.accepted;
    }

    if (
        normalizedStatus.includes("ejecución") ||
        normalizedStatus.includes("ejecucion")
    ) {
        return styles.execution;
    }

    if (
        normalizedStatus.includes("finalizada")
    ) {
        return styles.finished;
    }

    if (
        normalizedStatus.includes("cancelada")
    ) {
        return styles.cancelled;
    }

    if (
        normalizedStatus.includes("enviada")
    ) {
        return styles.sent;
    }

    return styles.draft;
}

function getQuotationIdentifier(quotation) {
    return (
        quotation?.id ||
        quotation?.quotationId ||
        quotation?.cotizacionId ||
        quotation?.folio ||
        ""
    );
}

export default function ClientQuotationHistory({
    quotations = [],
    onOpenQuotation,
}) {
    const orderedQuotations = [
        ...quotations,
    ].sort((quotationA, quotationB) => {
        const dateA = getTimestamp(
            quotationA?.updatedAt ||
            quotationA?.createdAt ||
            quotationA?.issuedAt ||
            quotationA?.fechaEmision ||
            quotationA?.date
        );

        const dateB = getTimestamp(
            quotationB?.updatedAt ||
            quotationB?.createdAt ||
            quotationB?.issuedAt ||
            quotationB?.fechaEmision ||
            quotationB?.date
        );

        return dateB - dateA;
    });

    const handleOpenQuotation = (
        event,
        quotation
    ) => {
        event.preventDefault();
        event.stopPropagation();

        const identifier =
            getQuotationIdentifier(quotation);

        if (!identifier) {
            window.alert(
                "Esta cotización no tiene un identificador válido."
            );

            return;
        }

        if (
            typeof onOpenQuotation !==
            "function"
        ) {
            console.error(
                "ClientQuotationHistory: onOpenQuotation no fue proporcionado."
            );

            window.alert(
                "No fue posible abrir la cotización."
            );

            return;
        }

        onOpenQuotation(quotation);
    };

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>
                        Cotizaciones
                    </h3>

                    <p
                        className={
                            styles.subtitle
                        }
                    >
                        Historial generado para este cliente
                    </p>
                </div>

                <span
                    className={styles.counter}
                >
                    {orderedQuotations.length}
                </span>
            </div>

            {orderedQuotations.length === 0 ? (
                <div className={styles.empty}>
                    <FileText
                        size={20}
                        strokeWidth={1.7}
                    />

                    <div>
                        <strong>
                            Sin cotizaciones
                        </strong>

                        <span>
                            Las cotizaciones nuevas aparecerán aquí.
                        </span>
                    </div>
                </div>
            ) : (
                <div className={styles.list}>
                    {orderedQuotations.map(
                        (quotation) => {
                            const status =
                                getStatus(
                                    quotation
                                );

                            const total =
                                quotation?.totals
                                    ?.total ??
                                quotation?.total ??
                                quotation?.totalCotizacion ??
                                quotation?.grandTotal ??
                                0;

                            const project =
                                quotation?.projectName ||
                                quotation?.proyecto ||
                                quotation?.project ||
                                "Sin nombre de proyecto";

                            const folio =
                                quotation?.folio ||
                                quotation?.quoteNumber ||
                                quotation?.numero ||
                                "Sin folio";

                            const date =
                                quotation?.updatedAt ||
                                quotation?.createdAt ||
                                quotation?.issuedAt ||
                                quotation?.fechaEmision ||
                                quotation?.date;

                            const quotationKey =
                                getQuotationIdentifier(
                                    quotation
                                ) ||
                                `${folio}-${getTimestamp(
                                    date
                                )}`;

                            return (
                                <button
                                    type="button"
                                    className={
                                        styles.item
                                    }
                                    key={
                                        quotationKey
                                    }
                                    onClick={(
                                        event
                                    ) =>
                                        handleOpenQuotation(
                                            event,
                                            quotation
                                        )
                                    }
                                    aria-label={`Abrir cotización ${folio}`}
                                    title={`Abrir cotización ${folio}`}
                                >
                                    <div
                                        className={
                                            styles.icon
                                        }
                                    >
                                        <FileText
                                            size={18}
                                            strokeWidth={
                                                1.7
                                            }
                                        />
                                    </div>

                                    <div
                                        className={
                                            styles.content
                                        }
                                    >
                                        <div
                                            className={
                                                styles.topLine
                                            }
                                        >
                                            <strong
                                                className={
                                                    styles.folio
                                                }
                                            >
                                                {
                                                    folio
                                                }
                                            </strong>

                                            <span
                                                className={`${styles.status} ${getStatusClass(
                                                    status
                                                )}`}
                                            >
                                                {
                                                    status
                                                }
                                            </span>
                                        </div>

                                        <span
                                            className={
                                                styles.project
                                            }
                                        >
                                            {project}
                                        </span>

                                        <span
                                            className={
                                                styles.date
                                            }
                                        >
                                            {formatDate(
                                                date
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        className={
                                            styles.amount
                                        }
                                    >
                                        <strong>
                                            {formatCurrency(
                                                total
                                            )}
                                        </strong>

                                        <ChevronRight
                                            size={17}
                                            strokeWidth={
                                                1.8
                                            }
                                        />
                                    </div>
                                </button>
                            );
                        }
                    )}
                </div>
            )}
        </section>
    );
}