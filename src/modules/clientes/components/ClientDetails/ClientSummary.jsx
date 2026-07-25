import {
    FileText,
    CheckCircle2,
    Clock3,
    DollarSign,
} from "lucide-react";

import styles from "./ClientSummary.module.css";

export default function ClientSummary({ quotations = [] }) {

    const totalQuoted = quotations.reduce(
        (sum, q) => sum + Number(q.totals?.total || 0),
        0
    );

    const totalAccepted = quotations
        .filter((q) => q.status === "Aceptada")
        .reduce(
            (sum, q) => sum + Number(q.totals?.total || 0),
            0
        );

    const pending = quotations
        .filter(
            (q) =>
                q.status !== "Aceptada" &&
                q.status !== "Cancelada"
        )
        .reduce(
            (sum, q) => sum + Number(q.totals?.total || 0),
            0
        );

    const lastQuotation =
        quotations.length > 0
            ? quotations.sort(
                  (a, b) =>
                      new Date(b.createdAt || 0) -
                      new Date(a.createdAt || 0)
              )[0]
            : null;

    const cards = [
        {
            icon: <DollarSign size={20} />,
            title: "Cotizado",
            value: `$${totalQuoted.toLocaleString("es-MX")}`,
        },
        {
            icon: <CheckCircle2 size={20} />,
            title: "Aceptado",
            value: `$${totalAccepted.toLocaleString("es-MX")}`,
        },
        {
            icon: <Clock3 size={20} />,
            title: "Pendiente",
            value: `$${pending.toLocaleString("es-MX")}`,
        },
        {
            icon: <FileText size={20} />,
            title: "Última cotización",
            value: lastQuotation?.folio || "Sin registros",
        },
    ];

    return (

        <section className={styles.wrapper}>

            {

                cards.map((card) => (

                    <article
                        key={card.title}
                        className={styles.card}
                    >

                        <div className={styles.icon}>

                            {card.icon}

                        </div>

                        <div className={styles.label}>

                            {card.title}

                        </div>

                        <div className={styles.value}>

                            {card.value}

                        </div>

                    </article>

                ))

            }

        </section>

    );

}