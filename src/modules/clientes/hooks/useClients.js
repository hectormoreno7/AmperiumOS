import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { db } from "../../../config/firebase";


function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function getDocumentTimestamp(documentData) {
    const timestamp =
        documentData?.updatedAt ||
        documentData?.createdAt ||
        documentData?.fechaActualizacion ||
        documentData?.fechaCreacion ||
        documentData?.fecha ||
        null;

    if (!timestamp) {
        return 0;
    }

    if (typeof timestamp?.toDate === "function") {
        return timestamp.toDate().getTime();
    }

    if (typeof timestamp?.seconds === "number") {
        return timestamp.seconds * 1000;
    }

    const parsedTimestamp = new Date(timestamp).getTime();

    return Number.isNaN(parsedTimestamp)
        ? 0
        : parsedTimestamp;
}

function sortByNewest(records) {
    return [...records].sort(
        (recordA, recordB) =>
            getDocumentTimestamp(recordB) -
            getDocumentTimestamp(recordA)
    );
}

function getClientName(client) {
    return (
        client?.name ||
        client?.nombre ||
        client?.razonSocial ||
        ""
    );
}

function getClientPhone(client) {
    return (
        client?.phones?.find(Boolean) ||
        client?.telefonos?.find(Boolean) ||
        client?.phone ||
        client?.telefono ||
        client?.telefonoPrincipal ||
        ""
    );
}

function getClientEmail(client) {
    return client?.email || client?.correo || "";
}

function isClientActive(client) {
    if (typeof client?.active === "boolean") {
        return client.active;
    }

    if (typeof client?.activo === "boolean") {
        return client.activo;
    }

    const status = normalizeText(
        client?.status || client?.estado
    );

    return status !== "inactive" && status !== "inactivo";
}

function subscribeToCollection({
    collectionName,
    onData,
    onError,
}) {
    const collectionReference = collection(
        db,
        collectionName
    );

    /*
     * Primero intenta ordenar desde Firestore.
     * Si la colección todavía no tiene createdAt en todos
     * los documentos, usa una suscripción sin orderBy.
     */
    try {
        const orderedQuery = query(
            collectionReference,
            orderBy("createdAt", "desc")
        );

        return onSnapshot(
            orderedQuery,
            (snapshot) => {
                const records = snapshot.docs.map(
                    (snapshotDocument) => ({
                        id: snapshotDocument.id,
                        ...snapshotDocument.data(),
                    })
                );

                onData(sortByNewest(records));
            },
            (error) => {
                console.warn(
                    `No se pudo ordenar ${collectionName}. Se intentará sin orderBy.`,
                    error
                );

                const fallbackUnsubscribe = onSnapshot(
                    collectionReference,
                    (snapshot) => {
                        const records = snapshot.docs.map(
                            (snapshotDocument) => ({
                                id: snapshotDocument.id,
                                ...snapshotDocument.data(),
                            })
                        );

                        onData(sortByNewest(records));
                    },
                    onError
                );

                return fallbackUnsubscribe;
            }
        );
    } catch (error) {
        console.warn(
            `No se pudo crear la consulta ordenada para ${collectionName}.`,
            error
        );

        return onSnapshot(
            collectionReference,
            (snapshot) => {
                const records = snapshot.docs.map(
                    (snapshotDocument) => ({
                        id: snapshotDocument.id,
                        ...snapshotDocument.data(),
                    })
                );

                onData(sortByNewest(records));
            },
            onError
        );
    }
}

export default function useClients() {
    const [clients, setClients] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [services, setServices] = useState([]);
    const [notes, setNotes] = useState([]);

    const [loadingClients, setLoadingClients] =
        useState(true);

    const [loadingQuotations, setLoadingQuotations] =
        useState(true);

    const [loadingServices, setLoadingServices] =
        useState(true);

    const [loadingNotes, setLoadingNotes] =
        useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("all");

    const [selectedClient, setSelectedClient] =
        useState(null);

    const [editingClient, setEditingClient] =
        useState(null);

    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribeClients =
            subscribeToCollection({
                collectionName: "clientes",

                onData: (records) => {
                    setClients(records);
                    setLoadingClients(false);
                    setError("");
                },

                onError: (subscriptionError) => {
                    console.error(
                        "Error al cargar clientes:",
                        subscriptionError
                    );

                    setError(
                        "No fue posible cargar los clientes."
                    );

                    setLoadingClients(false);
                },
            });

        const unsubscribeQuotations =
            subscribeToCollection({
                collectionName: "cotizaciones",

                onData: (records) => {
                    setQuotations(records);
                    setLoadingQuotations(false);
                },

                onError: (subscriptionError) => {
                    console.error(
                        "Error al cargar cotizaciones:",
                        subscriptionError
                    );

                    setLoadingQuotations(false);
                },
            });

        const unsubscribeServices =
            subscribeToCollection({
                collectionName: "servicios",

                onData: (records) => {
                    setServices(records);
                    setLoadingServices(false);
                },

                onError: (subscriptionError) => {
                    console.error(
                        "Error al cargar servicios:",
                        subscriptionError
                    );

                    setLoadingServices(false);
                },
            });

        const unsubscribeNotes =
            subscribeToCollection({
                collectionName: "notas",

                onData: (records) => {
                    setNotes(records);
                    setLoadingNotes(false);
                },

                onError: (subscriptionError) => {
                    console.error(
                        "Error al cargar notas:",
                        subscriptionError
                    );

                    setLoadingNotes(false);
                },
            });

        return () => {
            unsubscribeClients?.();
            unsubscribeQuotations?.();
            unsubscribeServices?.();
            unsubscribeNotes?.();
        };
    }, []);

    /*
     * Mantiene actualizado el cliente seleccionado si sus datos
     * cambian en Firestore mientras el expediente está abierto.
     */
    useEffect(() => {
        if (!selectedClient?.id) {
            return;
        }

        const updatedSelectedClient = clients.find(
            (client) =>
                client.id === selectedClient.id
        );

        if (!updatedSelectedClient) {
            setSelectedClient(null);
            return;
        }

        setSelectedClient((currentClient) => {
            if (
                JSON.stringify(currentClient) ===
                JSON.stringify(updatedSelectedClient)
            ) {
                return currentClient;
            }

            return updatedSelectedClient;
        });
    }, [clients, selectedClient?.id]);

    const filteredClients = useMemo(() => {
        const normalizedSearch = normalizeText(search);

        return clients.filter((client) => {
            const active = isClientActive(client);

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && active) ||
                (statusFilter === "inactive" && !active);

            if (!matchesStatus) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            const searchableValues = [
                getClientName(client),
                getClientPhone(client),
                getClientEmail(client),
                client?.address,
                client?.direccion,
                client?.reference,
                client?.referencia,
                client?.contact,
                client?.contacto,
                client?.empresa,
                client?.razonSocial,
                ...(Array.isArray(client?.phones)
                    ? client.phones
                    : []),
                ...(Array.isArray(client?.telefonos)
                    ? client.telefonos
                    : []),
            ];

            return searchableValues.some((value) =>
                normalizeText(value).includes(
                    normalizedSearch
                )
            );
        });
    }, [clients, search, statusFilter]);

    const saveClient = useCallback(
        async (clientData) => {
            try {
                setError("");

                const clientName = String(
                    clientData?.name ||
                    clientData?.nombre ||
                    ""
                ).trim();

                if (!clientName) {
                    throw new Error(
                        "El nombre del cliente es obligatorio."
                    );
                }

                const normalizedClientName =
                    normalizeText(clientName);

                const duplicatedClient = clients.find(
                    (client) => {
                        if (
                            editingClient?.id &&
                            client.id === editingClient.id
                        ) {
                            return false;
                        }

                        return (
                            normalizeText(
                                getClientName(client)
                            ) === normalizedClientName
                        );
                    }
                );

                if (duplicatedClient) {
                    throw new Error(
                        "Ya existe un cliente con ese nombre."
                    );
                }

                const normalizedClientData = {
                    ...clientData,

                    name:
                        clientData?.name ||
                        clientData?.nombre ||
                        clientName,

                    phone:
                        clientData?.phones?.find(Boolean) ||
                        clientData?.telefonos?.find(Boolean) ||
                        clientData?.phone ||
                        clientData?.telefono ||
                        "",

                    email:
                        clientData?.email ||
                        clientData?.correo ||
                        "",

                    address:
                        clientData?.address ||
                        clientData?.direccion ||
                        "",

                    active:
                        typeof clientData?.active ===
                        "boolean"
                            ? clientData.active
                            : typeof clientData?.activo ===
                                "boolean"
                              ? clientData.activo
                              : true,

                    updatedAt: serverTimestamp(),
                };

                if (editingClient?.id) {
                    const clientReference = doc(
                        db,
                        "clientes",
                        editingClient.id
                    );

                    await updateDoc(
                        clientReference,
                        normalizedClientData
                    );
                } else {
                    await addDoc(
                        collection(db, "clientes"),
                        {
                            ...normalizedClientData,
                            createdAt: serverTimestamp(),
                        }
                    );
                }

                setModalOpen(false);
                setEditingClient(null);

                return {
                    success: true,
                };
            } catch (saveError) {
                console.error(
                    "Error al guardar cliente:",
                    saveError
                );

                const errorMessage =
                    saveError?.message ||
                    "No fue posible guardar el cliente.";

                setError(errorMessage);

                return {
                    success: false,
                    error: errorMessage,
                };
            }
        },
        [clients, editingClient]
    );

    const editClient = useCallback((client) => {
        setEditingClient(client);
        setModalOpen(true);
    }, []);

    const deleteClient = useCallback(
        async (clientId) => {
            if (!clientId) {
                return {
                    success: false,
                    error: "No se encontró el cliente.",
                };
            }

            try {
                setError("");

                await deleteDoc(
                    doc(db, "clientes", clientId)
                );

                if (selectedClient?.id === clientId) {
                    setSelectedClient(null);
                }

                if (editingClient?.id === clientId) {
                    setEditingClient(null);
                    setModalOpen(false);
                }

                return {
                    success: true,
                };
            } catch (deleteError) {
                console.error(
                    "Error al eliminar cliente:",
                    deleteError
                );

                const errorMessage =
                    deleteError?.message ||
                    "No fue posible eliminar el cliente.";

                setError(errorMessage);

                return {
                    success: false,
                    error: errorMessage,
                };
            }
        },
        [editingClient, selectedClient]
    );

    const changeClientStatus = useCallback(
        async (client, active) => {
            if (!client?.id) {
                return {
                    success: false,
                    error: "No se encontró el cliente.",
                };
            }

            try {
                setError("");

                await updateDoc(
                    doc(db, "clientes", client.id),
                    {
                        active,
                        activo: active,
                        status: active
                            ? "active"
                            : "inactive",
                        estado: active
                            ? "activo"
                            : "inactivo",
                        updatedAt: serverTimestamp(),
                    }
                );

                return {
                    success: true,
                };
            } catch (statusError) {
                console.error(
                    "Error al cambiar estado:",
                    statusError
                );

                const errorMessage =
                    statusError?.message ||
                    "No fue posible cambiar el estado.";

                setError(errorMessage);

                return {
                    success: false,
                    error: errorMessage,
                };
            }
        },
        []
    );

    const loading =
        loadingClients ||
        loadingQuotations ||
        loadingServices ||
        loadingNotes;

    return {
        clients,
        filteredClients,
        quotations,
        services,
        notes,

        loading,
        loadingClients,
        loadingQuotations,
        loadingServices,
        loadingNotes,

        error,
        setError,

        search,
        setSearch,

        statusFilter,
        setStatusFilter,

        selectedClient,
        setSelectedClient,

        editingClient,
        setEditingClient,

        modalOpen,
        setModalOpen,

        saveClient,
        editClient,
        deleteClient,
        changeClientStatus,
    };
}
