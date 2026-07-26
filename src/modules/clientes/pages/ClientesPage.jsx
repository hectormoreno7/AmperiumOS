import {
    Plus,
    X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import useClients from "../hooks/useClients";

import ClientsToolbar from "../components/ClientsToolbar";
import ClientsGrid from "../components/ClientsGrid";
import ClientDetails from "../components/ClientDetails/ClientDetails";
import ClientFormModal from "../components/ClientFormModal";

import styles from "./ClientesPage.module.css";

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function getClientIdFromRecord(record) {
    return (
        record?.clientId ||
        record?.clienteId ||
        record?.customerId ||
        record?.client?.id ||
        record?.cliente?.id ||
        ""
    );
}

function getClientNameFromRecord(record) {
    return (
        record?.clientName ||
        record?.clienteNombre ||
        record?.customerName ||
        record?.client?.name ||
        record?.cliente?.nombre ||
        record?.cliente ||
        ""
    );
}

function matchesClient(record, client) {
    if (!record || !client) {
        return false;
    }

    const recordClientId = String(
        getClientIdFromRecord(record)
    ).trim();

    const currentClientId = String(
        client?.id ||
        client?.clientId ||
        client?.clienteId ||
        ""
    ).trim();

    if (recordClientId && currentClientId) {
        return recordClientId === currentClientId;
    }

    const recordClientName = normalizeText(
        getClientNameFromRecord(record)
    );

    const currentClientName = normalizeText(
        client?.name ||
        client?.nombre ||
        client?.razonSocial
    );

    return (
        Boolean(recordClientName) &&
        Boolean(currentClientName) &&
        recordClientName === currentClientName
    );
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

function getServiceIdentifier(service) {
    return (
        service?.id ||
        service?.serviceId ||
        service?.servicioId ||
        service?.folio ||
        ""
    );
}

function getNoteIdentifier(note) {
    return (
        note?.id ||
        note?.noteId ||
        note?.notaId ||
        note?.folio ||
        ""
    );
}

export default function ClientesPage() {
    const navigate = useNavigate();

    const {
        loading,
        filteredClients,
        quotations = [],
        services = [],
        notes = [],

        selectedClient,
        modalOpen,
        editingClient,

        search,
        statusFilter,

        setSearch,
        setStatusFilter,
        setSelectedClient,
        setModalOpen,
        setEditingClient,

        setError,
        saveClient,
        deleteClient,
    } = useClients();

    const clientQuotations = selectedClient
        ? quotations.filter((quotation) =>
              matchesClient(
                  quotation,
                  selectedClient
              )
          )
        : [];

    const clientServices = selectedClient
        ? services.filter((service) =>
              matchesClient(
                  service,
                  selectedClient
              )
          )
        : [];

    const clientNotes = selectedClient
        ? notes.filter((note) =>
              matchesClient(
                  note,
                  selectedClient
              )
          )
        : [];

    const openNewClient = () => {
        setEditingClient(null);
        setModalOpen(true);
    };

    const openClientDetails = (client) => {
        setSelectedClient(client);
    };

    const closeClientDetails = () => {
        setSelectedClient(null);
    };

    const editSelectedClient = () => {
        if (!selectedClient) {
            return;
        }

        setEditingClient(selectedClient);
        setModalOpen(true);
    };

    const deleteSelectedClient = async () => {
        if (!selectedClient?.id) {
            return;
        }

        const relatedCount =
            clientQuotations.length +
            clientServices.length +
            clientNotes.length;
        const historyMessage = relatedCount
            ? ` Sus ${relatedCount} documentos relacionados se conservarán en el historial.`
            : "";

        if (
            !window.confirm(
                `¿Eliminar a ${selectedClient.name || "este cliente"}?${historyMessage}`
            )
        ) {
            return;
        }

        const result = await deleteClient(
            selectedClient.id
        );

        if (!result?.success) {
            window.alert(
                result?.error ||
                    "No fue posible eliminar el cliente."
            );
        }
    };

    const openQuotation = (quotation) => {
        const quotationIdentifier =
            getQuotationIdentifier(quotation);

        if (!quotationIdentifier) {
            const message =
                "No se encontró el identificador de la cotización.";

            if (typeof setError === "function") {
                setError(message);
            }

            window.alert(message);
            return;
        }

        setSelectedClient(null);

        navigate(
            `/cotizaciones?open=${encodeURIComponent(
                quotationIdentifier
            )}`,
            {
                state: {
                    openQuotationId:
                        quotationIdentifier,

                    openQuotation:
                        quotation,
                },
            }
        );
    };

    const openService = (service) => {
        const serviceIdentifier =
            getServiceIdentifier(service);

        if (!serviceIdentifier) {
            const message =
                "No se encontró el identificador del servicio.";

            if (typeof setError === "function") {
                setError(message);
            }

            window.alert(message);
            return;
        }

        setSelectedClient(null);

        navigate(
            `/servicios?open=${encodeURIComponent(
                serviceIdentifier
            )}`,
            {
                state: {
                    openServiceId:
                        serviceIdentifier,

                    openService:
                        service,
                },
            }
        );
    };

    const openNote = (note) => {
        const noteIdentifier =
            getNoteIdentifier(note);

        if (!noteIdentifier) {
            const message =
                "No se encontró el identificador de la nota.";

            if (typeof setError === "function") {
                setError(message);
            }

            window.alert(message);
            return;
        }

        setSelectedClient(null);

        navigate(
            `/notas?open=${encodeURIComponent(
                noteIdentifier
            )}`,
            {
                state: {
                    openNoteId:
                        noteIdentifier,

                    openNote:
                        note,
                },
            }
        );
    };

    const closeClientModal = () => {
        setModalOpen(false);
        setEditingClient(null);
    };

    return (
        <section className={styles.page}>
            <ClientsToolbar
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
            />

            <ClientsGrid
                clients={filteredClients}
                quotations={quotations}
                services={services}
                notes={notes}
                loading={loading}
                onDetails={openClientDetails}
            />

            {selectedClient ? (
                <div
                    className={styles.overlay}
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeClientDetails();
                        }
                    }}
                >
                    <aside
                        className={styles.detailsPanel}
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={closeClientDetails}
                            aria-label="Cerrar detalles"
                            title="Cerrar"
                        >
                            <X
                                size={19}
                                strokeWidth={1.8}
                            />
                        </button>

                        <ClientDetails
                            client={selectedClient}
                            quotations={
                                clientQuotations
                            }
                            services={
                                clientServices
                            }
                            notes={clientNotes}
                            onEdit={
                                editSelectedClient
                            }
                            onDelete={
                                deleteSelectedClient
                            }
                            onOpenQuotation={
                                openQuotation
                            }
                            onOpenService={
                                openService
                            }
                            onOpenNote={openNote}
                        />
                    </aside>
                </div>
            ) : null}

            <button
                type="button"
                className={styles.fab}
                onClick={openNewClient}
                aria-label="Nuevo cliente"
                title="Nuevo cliente"
            >
                <Plus
                    size={25}
                    strokeWidth={2}
                />
            </button>

            <ClientFormModal
                isOpen={modalOpen}
                client={editingClient}
                existingClients={filteredClients}
                onClose={closeClientModal}
                onSave={saveClient}
            />
        </section>
    );
}
