import {
  useEffect,
  useState,
} from 'react'
import {
  Building2,
  Download,
  FileText,
  Palette,
  Percent,
  Save,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react'
import {
  DEFAULT_CONFIGURATION,
  applyConfigurationTheme,
  saveConfiguration,
  subscribeToConfiguration,
  uploadConfigurationAsset,
} from '../services/configuracionService'
import styles from './BusinessSettings.module.css'

function BusinessSettings() {
  const [activeSection, setActiveSection] =
    useState('empresa')
  const [form, setForm] = useState(
    DEFAULT_CONFIGURATION,
  )
  const [saving, setSaving] =
    useState(false)
  const [message, setMessage] =
    useState('')

  useEffect(
    () =>
      subscribeToConfiguration(
        (configuration) => {
          setForm(configuration)
          applyConfigurationTheme(
            configuration,
          )
        },
        (error) =>
          setMessage(error.message),
      ),
    [],
  )

  const update = (field, value) => {
    const next = {
      ...form,
      [field]: value,
    }
    setForm(next)

    if (
      field === 'primaryColor' ||
      field === 'secondaryColor'
    ) {
      applyConfigurationTheme(next)
    }
  }

  const uploadAsset = async (
    event,
    field,
    name,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSaving(true)
    setMessage('')
    try {
      const url =
        await uploadConfigurationAsset(
          file,
          name,
        )
      update(field, url)
      setMessage(
        'Archivo cargado. Guarda los cambios para confirmarlo.',
      )
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await saveConfiguration(form)
      setMessage(
        'Configuración guardada correctamente.',
      )
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const exportConfiguration = () => {
    const blob = new Blob(
      [JSON.stringify(form, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const anchor =
      document.createElement('a')
    anchor.href = url
    anchor.download =
      'amperium-configuracion.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <form
      className={styles.wrapper}
      onSubmit={submit}
    >
      <nav className={styles.sectionMenu}>
        {[
          ['empresa', 'Empresa'],
          ['identidad', 'Logos y colores'],
          ['finanzas', 'Finanzas'],
          ['documentos', 'Garantías y términos'],
          ['administracion', 'Respaldos y usuarios'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={
              activeSection === id
                ? styles.sectionActive
                : ''
            }
            onClick={() => setActiveSection(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeSection === 'empresa' ? (
      <section className={styles.card}>
        <header>
          <Building2 size={20} />
          <div>
            <h2>Empresa</h2>
            <p>Identidad y contacto comercial.</p>
          </div>
        </header>
        <div className={styles.grid}>
          <label>
            Nombre comercial
            <input
              value={form.companyName}
              onChange={(event) =>
                update(
                  'companyName',
                  event.target.value,
                )
              }
            />
          </label>
          <label>
            Razón social
            <input
              value={form.legalName}
              onChange={(event) =>
                update(
                  'legalName',
                  event.target.value,
                )
              }
            />
          </label>
          <label>
            Teléfono
            <input
              value={form.phone}
              onChange={(event) =>
                update(
                  'phone',
                  event.target.value,
                )
              }
            />
          </label>
          <label>
            Responsable
            <input
              value={form.responsibleName}
              onChange={(event) =>
                update(
                  'responsibleName',
                  event.target.value,
                )
              }
            />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                update(
                  'email',
                  event.target.value,
                )
              }
            />
          </label>
          <label className={styles.full}>
            Dirección
            <input
              value={form.address}
              onChange={(event) =>
                update(
                  'address',
                  event.target.value,
                )
              }
            />
          </label>
        </div>
      </section>
      ) : null}

      {activeSection === 'identidad' ? (
      <section className={styles.card}>
        <header>
          <Palette size={20} />
          <div>
            <h2>Identidad visual</h2>
            <p>Colores, logotipo y firma.</p>
          </div>
        </header>
        <div className={styles.grid}>
          <label>
            Color principal
            <input
              type="color"
              value={form.primaryColor}
              onChange={(event) =>
                update(
                  'primaryColor',
                  event.target.value,
                )
              }
            />
          </label>
          <label>
            Color secundario
            <input
              type="color"
              value={form.secondaryColor}
              onChange={(event) =>
                update(
                  'secondaryColor',
                  event.target.value,
                )
              }
            />
          </label>
          <label className={styles.file}>
            <Upload size={17} />
            Cargar logotipo principal
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                uploadAsset(
                  event,
                  'logoUrl',
                  'logo',
                )
              }
            />
          </label>
          <label className={styles.file}>
            <Upload size={17} />
            Cargar isotipo o icono
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                uploadAsset(
                  event,
                  'iconUrl',
                  'icono',
                )
              }
            />
          </label>
          <label className={styles.file}>
            <Upload size={17} />
            Cargar firma responsable
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                uploadAsset(
                  event,
                  'responsibleSignatureUrl',
                  'firma-responsable',
                )
              }
            />
          </label>
          {form.logoUrl ? (
            <img
              className={styles.preview}
              src={form.logoUrl}
              alt="Logotipo configurado"
            />
          ) : null}
          {form.iconUrl ? (
            <img
              className={styles.iconPreview}
              src={form.iconUrl}
              alt="Icono configurado"
            />
          ) : null}
        </div>
      </section>
      ) : null}

      {activeSection === 'finanzas' ? (
      <section className={styles.card}>
        <header>
          <Percent size={20} />
          <div>
            <h2>Finanzas</h2>
            <p>Valores predeterminados.</p>
          </div>
        </header>
        <div className={styles.grid}>
          <label>
            IVA (%)
            <input
              type="number"
              min="0"
              max="100"
              value={form.taxRate}
              onChange={(event) =>
                update(
                  'taxRate',
                  event.target.value,
                )
              }
            />
          </label>
          <label>
            Utilidad (%)
            <input
              type="number"
              min="0"
              value={form.utilityRate}
              onChange={(event) =>
                update(
                  'utilityRate',
                  event.target.value,
                )
              }
            />
          </label>
          <label>
            Anticipo predeterminado (%)
            <input
              type="number"
              min="0"
              max="100"
              value={
                form.defaultAdvanceRate
              }
              onChange={(event) =>
                update(
                  'defaultAdvanceRate',
                  event.target.value,
                )
              }
            />
          </label>
        </div>
      </section>
      ) : null}

      {activeSection === 'documentos' ? (
      <section className={styles.card}>
        <header>
          <ShieldCheck size={20} />
          <div>
            <h2>Garantías y términos</h2>
            <p>Textos base de documentos.</p>
          </div>
        </header>
        <div className={styles.grid}>
          <label className={styles.full}>
            Garantía predeterminada
            <textarea
              rows="4"
              value={form.warranty}
              onChange={(event) =>
                update(
                  'warranty',
                  event.target.value,
                )
              }
            />
          </label>
          <label className={styles.full}>
            Términos predeterminados
            <textarea
              rows="6"
              value={form.terms}
              onChange={(event) =>
                update(
                  'terms',
                  event.target.value,
                )
              }
            />
          </label>
        </div>
      </section>
      ) : null}

      {activeSection === 'administracion' ? (
      <section className={styles.card}>
        <header>
          <FileText size={20} />
          <div>
            <h2>Administración</h2>
            <p>Respaldos y acceso.</p>
          </div>
        </header>
        <div className={styles.admin}>
          <button
            type="button"
            onClick={exportConfiguration}
          >
            <Download size={17} />
            Exportar configuración
          </button>
          <div>
            <Users size={18} />
            <span>
              Usuarios: administración de roles en la siguiente etapa.
            </span>
          </div>
        </div>
      </section>
      ) : null}

      {message ? (
        <p className={styles.message}>
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        className={styles.save}
        disabled={saving}
      >
        <Save size={18} />
        {saving
          ? 'Guardando…'
          : 'Guardar configuración'}
      </button>
    </form>
  )
}

export default BusinessSettings
