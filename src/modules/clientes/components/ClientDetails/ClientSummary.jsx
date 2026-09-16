import {
    FileText,
    CheckCircle2,
    Clock3,
    DollarSign,
} from "lucide-react";

import styles from "./ClientSummary.module.css";

export default function ClientSummary({ quotations = [] }) {
    const isAccepted = (quotation) =>
        String(quotation?.status || "")
            .trim()
            .toLowerCase() === "aceptada";

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const totalAccepted = quotations
        .filter(isAccepted)
        .reduce(
            (sum, q) => sum + Number(q.totals?.total || 0),
            0
        );

    const acceptedThisMonth = quotations
        .filter((quotation) => {
            if (!isAccepted(quotation) || !quotation.acceptedAt) {
                return false;
            }

            const acceptedAt = new Date(quotation.acceptedAt);

            return (
                !Number.isNaN(acceptedAt.getTime()) &&
                acceptedAt.getMonth() === currentMonth &&
                acceptedAt.getFullYear() === currentYear
            );
        })
        .reduce(
            (sum, quotation) =>
                sum + Number(quotation.totals?.total || 0),
            0
        );

    const pending = quotations
        .filter(
            (q) =>
                !isAccepted(q) &&
                String(q.status || "").trim().toLowerCase() !== "cancelada"
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
            title: "Aceptado este mes",
            value: `$${acceptedThisMonth.toLocaleString("es-MX")}`,
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
