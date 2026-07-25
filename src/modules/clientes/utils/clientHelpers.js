export const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const cleanPhone = (phone) =>
  String(phone ?? "").replace(/\D/g, "");

export const formatPhone = (phone) => {
  const cleaned = cleanPhone(phone);

  if (cleaned.length === 10) {
    return cleaned.replace(
      /(\d{3})(\d{3})(\d{4})/,
      "$1 $2 $3"
    );
  }

  return phone;
};

export const getWhatsAppPhone = (phone) => {
  const cleaned = cleanPhone(phone);

  if (!cleaned) return "";

  if (
    cleaned.length === 10 &&
    !cleaned.startsWith("52")
  ) {
    return `52${cleaned}`;
  }

  return cleaned;
};

export const formatDate = (date) => {
  if (!date) return "Sin fecha";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

export const money = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));

export const getClientReference = (client) => {
  if (client.contactName) return client.contactName;

  if (client.notes) return client.notes;

  return "Sin referencia";
};

export const getQuotationStatusLabel = (status) => {
  return {
    borrador: "Borrador",
    enviada: "Enviada",
    aceptada: "Aceptada",
    en_ejecucion: "En ejecución",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
  }[status] || "Borrador";
};

export const getFirebaseErrorMessage = (error) => {
  const code = error?.code ?? "";

  if (code.includes("permission-denied")) {
    return "Firebase no permitió acceder a la información.";
  }

  if (code.includes("unavailable")) {
    return "No fue posible conectar con Firebase.";
  }

  if (code.includes("failed-precondition")) {
    return "Firestore necesita configuración.";
  }

  return (
    error?.message ??
    "Ocurrió un error."
  );
};