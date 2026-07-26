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

    const phone =
        client?.phones?.find(Boolean) ||
        client?.telefonos?.find(Boolean) ||
        client?.phone ||
        client?.telefono ||
        "";

    const copy = (text) => {

        if (!text) return;

        navigator.clipboard.writeText(text);

    };

    const openWhatsApp = () => {

        if (!phone) return;

        const cleanPhone = phone.replace(/\D/g, "");

        window.open(
            `https://wa.me/${cleanPhone.startsWith("52") ? cleanPhone : `52${cleanPhone}`}`,
            "_blank"
        );

    };

    const call = () => {

        if (!phone) return;

        window.location.href = `tel:${phone.replace(/[^\d+]/g, "")}`;

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

                    <span>{phone || "-"}</span>

                    {

                        phone &&

                        <div className={styles.actions}>

                            <button onClick={call}>

                                <Phone size={16}/>

                            </button>

                            <button onClick={openWhatsApp}>

                                <MessageCircle size={16}/>

                            </button>

                            <button onClick={()=>copy(phone)}>

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
