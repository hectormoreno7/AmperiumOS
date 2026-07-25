import {
    Phone,
    Mail,
    MapPin,
    MessageCircle,
    Copy,
} from "lucide-react";

import styles from "./ClientInfo.module.css";

export default function ClientInfo({ client }) {

    if (!client) return null;

    const copy = (text) => {

        if (!text) return;

        navigator.clipboard.writeText(text);

    };

    const openWhatsApp = () => {

        if (!client.phone) return;

        const phone = client.phone.replace(/\D/g, "");

        window.open(
            `https://wa.me/52${phone}`,
            "_blank"
        );

    };

    const call = () => {

        if (!client.phone) return;

        window.location.href = `tel:${client.phone}`;

    };

    const maps = () => {

        if (!client.address) return;

        window.open(

            `https://www.google.com/maps/search/${encodeURIComponent(
                client.address
            )}`,

            "_blank"

        );

    };

    return (

        <section className={styles.card}>

            <h2 className={styles.title}>

                Información del cliente

            </h2>

            <div className={styles.grid}>

                <div className={styles.label}>Contacto</div>

                <div className={styles.value}>

                    {client.contact || "-"}

                </div>

                <div className={styles.label}>Teléfono</div>

                <div className={styles.value}>

                    <span>{client.phone || "-"}</span>

                    {

                        client.phone &&

                        <div className={styles.actions}>

                            <button onClick={call}>

                                <Phone size={16}/>

                            </button>

                            <button onClick={openWhatsApp}>

                                <MessageCircle size={16}/>

                            </button>

                            <button onClick={()=>copy(client.phone)}>

                                <Copy size={16}/>

                            </button>

                        </div>

                    }

                </div>

                <div className={styles.label}>Correo</div>

                <div className={styles.value}>

                    <span>

                        {client.email || "-"}

                    </span>

                    {

                        client.email &&

                        <div className={styles.actions}>

                            <button

                                onClick={()=>

                                    window.location.href=`mailto:${client.email}`

                                }

                            >

                                <Mail size={16}/>

                            </button>

                            <button

                                onClick={()=>copy(client.email)}

                            >

                                <Copy size={16}/>

                            </button>

                        </div>

                    }

                </div>

                <div className={styles.label}>Dirección</div>

                <div className={styles.value}>

                    <span>

                        {client.address || "-"}

                    </span>

                    {

                        client.address &&

                        <div className={styles.actions}>

                            <button

                                onClick={maps}

                            >

                                <MapPin size={16}/>

                            </button>

                        </div>

                    }

                </div>

                <div className={styles.label}>

                    Notas

                </div>

                <div className={styles.notes}>

                    {client.notes || "Sin notas."}

                </div>

            </div>

        </section>

    );

}