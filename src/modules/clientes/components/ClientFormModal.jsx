import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import branding from '../../../shared/constants/branding'
import useCompanyConfiguration from '../../configuracion/hooks/useCompanyConfiguration'
import styles from './ClientFormModal.module.css'

const emptyClient = {
  name: '',
  contactName: '',
  phones: [''],
  email: '',
  address: '',
  notes: '',
  status: 'active',
}

const normalizePhone = (phone) =>
  phone.replace(/[^\d+]/g, '')

function ClientFormModal({
  isOpen,
  client,
  existingClients,
  onClose,
  onSave,
}) {
  const companyConfiguration =
    useCompanyConfiguration()
  const [formData, setFormData] =
    useState(emptyClient)

  const [errors, setErrors] = useState({})

  const isEditing = Boolean(client?.id)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (client) {
      setFormData({
        name: client.name ?? '',
        contactName: client.contactName ?? '',
        phones:
          client.phones?.length > 0
            ? client.phones
            : client.phone
              ? [client.phone]
              : [''],
        email: client.email ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
        status: client.status ?? 'active',
      })
    } else {
      setFormData(emptyClient)
    }

    setErrors({})
  }, [client, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const originalOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.body.style.overflow =
        originalOverflow

      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [isOpen, onClose])

  const duplicateClient = useMemo(() => {
    const normalizedName = formData.name
      .trim()
      .toLowerCase()

    const normalizedPhones = formData.phones
      .map(normalizePhone)
      .filter(Boolean)

    if (
      !normalizedName &&
      normalizedPhones.length === 0
    ) {
      return null
    }

    return existingClients.find(
      (existingClient) => {
        if (existingClient.id === client?.id) {
          return false
        }

        const sameName =
          existingClient.name
            .trim()
            .toLowerCase() === normalizedName

        const existingPhones =
          existingClient.phones.map(
            normalizePhone,
          )

        const samePhone =
          normalizedPhones.some((phone) =>
            existingPhones.includes(phone),
          )

        return sameName || samePhone
      },
    )
  }, [
    client?.id,
    existingClients,
    formData.name,
    formData.phones,
  ])

  if (!isOpen) {
    return null
  }

  const updateField = (field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }))

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: '',
    }))
  }

  const updatePhone = (index, value) => {
    setFormData((currentData) => ({
      ...currentData,
      phones: currentData.phones.map(
        (phone, phoneIndex) =>
          phoneIndex === index ? value : phone,
      ),
    }))

    setErrors((currentErrors) => ({
      ...currentErrors,
      phones: '',
    }))
  }

  const addPhone = () => {
    setFormData((currentData) => ({
      ...currentData,
      phones: [...currentData.phones, ''],
    }))
  }

  const removePhone = (index) => {
    setFormData((currentData) => {
      const nextPhones =
        currentData.phones.filter(
          (_, phoneIndex) =>
            phoneIndex !== index,
        )

      return {
        ...currentData,
        phones:
          nextPhones.length > 0
            ? nextPhones
            : [''],
      }
    })
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name =
        'Ingresa el nombre o razón social.'
    }

    const validPhones = formData.phones
      .map(normalizePhone)
      .filter(Boolean)

    if (validPhones.length === 0) {
      nextErrors.phones =
        'Ingresa por lo menos un teléfono.'
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim(),
      )
    ) {
      nextErrors.email =
        'Ingresa un correo válido.'
    }

    if (duplicateClient) {
      nextErrors.duplicate =
        `Ya existe un cliente similar: ${duplicateClient.name}.`
    }

    setErrors(nextErrors)

    return (
      Object.keys(nextErrors).length === 0
    )
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    onSave({
      ...formData,
      name: formData.name.trim(),
      contactName:
        formData.contactName.trim(),
      phones: formData.phones
        .map(normalizePhone)
        .filter(Boolean),
      email: formData.email
        .trim()
        .toLowerCase(),
      address: formData.address.trim(),
      notes: formData.notes.trim(),
    })
  }

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
      >
        <header className={styles.modalHeader}>
          <div className={styles.brandArea}>
            <img
              src={
                companyConfiguration.logoUrl ||
                branding.logos
                  .horizontalSimpleDarkBackground
              }
              alt={branding.appName}
              className={styles.brandLogo}
            />

            <div className={styles.headerText}>
              <span>
                Directorio de clientes
              </span>

              <h2 id="client-modal-title">
                {isEditing
                  ? 'Editar cliente'
                  : 'Nuevo cliente'}
              </h2>

              <p>
                Registra los datos generales,
                contacto y ubicación del cliente.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </header>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          {errors.duplicate && (
            <div className={styles.warning}>
              <strong>
                Posible cliente duplicado
              </strong>

              <span>
                {errors.duplicate}
              </span>
            </div>
          )}

          <div className={styles.formGrid}>
            <label className={styles.fullWidth}>
              <span>
                Nombre o razón social
                <strong>*</strong>
              </span>

              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  updateField(
                    'name',
                    event.target.value,
                  )
                }
                placeholder="Ej. Constructora Amperium"
                autoFocus
              />

              {errors.name && (
                <small className={styles.error}>
                  {errors.name}
                </small>
              )}
            </label>

            <label>
              <span>
                Persona de contacto o referencia
              </span>

              <input
                type="text"
                value={formData.contactName}
                onChange={(event) =>
                  updateField(
                    'contactName',
                    event.target.value,
                  )
                }
                placeholder="Ej. Señor de la tienda de la esquina"
              />
            </label>

            <label>
              <span>Estado del cliente</span>

              <select
                value={formData.status}
                onChange={(event) =>
                  updateField(
                    'status',
                    event.target.value,
                  )
                }
              >
                <option value="active">
                  Activo
                </option>

                <option value="inactive">
                  Inactivo
                </option>
              </select>
            </label>

            <div
              className={`${styles.phoneSection} ${styles.fullWidth}`}
            >
              <div className={styles.phoneHeader}>
                <div>
                  <span>
                    Teléfonos
                    <strong>*</strong>
                  </span>

                  <small>
                    Puedes registrar varios números.
                  </small>
                </div>

                <button
                  type="button"
                  onClick={addPhone}
                >
                  <span>+</span>
                  Agregar teléfono
                </button>
              </div>

              <div className={styles.phoneList}>
                {formData.phones.map(
                  (phone, index) => (
                    <div
                      className={styles.phoneRow}
                      key={`phone-${index}`}
                    >
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(event) =>
                          updatePhone(
                            index,
                            event.target.value,
                          )
                        }
                        placeholder="228 000 0000"
                      />

                      {formData.phones.length >
                        1 && (
                        <button
                          type="button"
                          className={
                            styles.removePhoneButton
                          }
                          onClick={() =>
                            removePhone(index)
                          }
                          aria-label="Eliminar teléfono"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ),
                )}
              </div>

              {errors.phones && (
                <small className={styles.error}>
                  {errors.phones}
                </small>
              )}
            </div>

            <label>
              <span>Correo electrónico</span>

              <input
                type="email"
                inputMode="email"
                value={formData.email}
                onChange={(event) =>
                  updateField(
                    'email',
                    event.target.value,
                  )
                }
                placeholder="cliente@correo.com"
              />

              {errors.email && (
                <small className={styles.error}>
                  {errors.email}
                </small>
              )}
            </label>

            <label>
              <span>Dirección o ubicación</span>

              <input
                type="text"
                value={formData.address}
                onChange={(event) =>
                  updateField(
                    'address',
                    event.target.value,
                  )
                }
                placeholder="Calle, colonia, ciudad"
              />
            </label>

            <label className={styles.fullWidth}>
              <span>Notas del cliente</span>

              <textarea
                rows="4"
                value={formData.notes}
                onChange={(event) =>
                  updateField(
                    'notes',
                    event.target.value,
                  )
                }
                placeholder="Referencias, indicaciones o información adicional"
              />
            </label>
          </div>

          <footer className={styles.formFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={styles.saveButton}
            >
              <span>✓</span>

              {isEditing
                ? 'Guardar cambios'
                : 'Registrar cliente'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default ClientFormModal
