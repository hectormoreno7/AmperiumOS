import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { subscribeToQuotations } from '../../cotizaciones/services/cotizacionesService'
import { subscribeToServices } from '../../servicios/services/serviciosService'
import {
  createList,
  deleteList,
  subscribeToLists,
  updateListItems,
  updateList,
} from '../services/listasService'
import styles from './ListasPage.module.css'

const newItem = () => ({
  id: crypto.randomUUID(),
  text: '',
  done: false,
})

function ListasPage() {
  const [searchParams] =
    useSearchParams()
  const requestedType =
    searchParams.get('type') || ''
  const requestedId =
    searchParams.get('id') || ''
  const [lists, setLists] = useState([])
  const [quotations, setQuotations] =
    useState([])
  const [services, setServices] =
    useState([])
  const [open, setOpen] = useState(
    Boolean(requestedId),
  )
  const [title, setTitle] = useState('')
  const [linkType, setLinkType] =
    useState(
      ['cotizacion', 'servicio'].includes(
        requestedType,
      )
        ? requestedType
        : '',
    )
  const [linkId, setLinkId] = useState(
    requestedId,
  )
  const [items, setItems] = useState([
    newItem(),
  ])
  const [editingList, setEditingList] = useState(null)

  useEffect(() => {
    const unsubscribeLists =
      subscribeToLists(setLists)
    const unsubscribeQuotations =
      subscribeToQuotations(
        setQuotations,
      )
    const unsubscribeServices =
      subscribeToServices(setServices)
    return () => {
      unsubscribeLists()
      unsubscribeQuotations()
      unsubscribeServices()
    }
  }, [])

  const linkOptions = useMemo(
    () =>
      linkType === 'cotizacion'
        ? quotations
        : linkType === 'servicio'
          ? services
          : [],
    [linkType, quotations, services],
  )

  const save = async (event) => {
    event.preventDefault()
    const cleanItems = items
      .map((item) => ({
        ...item,
        text: item.text.trim(),
      }))
      .filter((item) => item.text)
    if (!cleanItems.length) return
    const linked = linkOptions.find(
      (item) => item.id === linkId,
    )
    const value = {
      title,
      linkType,
      linkId,
      linkLabel:
        linked?.folio ||
        linked?.title ||
        '',
      items: cleanItems,
    }
    if (editingList) {
      await updateList(editingList.id, value)
    } else {
      await createList(value)
    }
    setTitle('')
    setLinkType('')
    setLinkId('')
    setItems([newItem()])
    setEditingList(null)
    setOpen(false)
  }

  const toggleItem = async (
    list,
    itemId,
  ) =>
    updateListItems(
      list.id,
      list.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              done: !item.done,
            }
          : item,
      ),
    )

  const openEdit = (list) => {
    setEditingList(list)
    setTitle(list.title)
    setLinkType(list.linkType)
    setLinkId(list.linkId)
    setItems(list.items.length ? list.items : [newItem()])
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setEditingList(null)
    setTitle('')
    setLinkType('')
    setLinkId('')
    setItems([newItem()])
  }

  return (
    <section className={styles.page}>
      <div className={styles.grid}>
        {lists.map((list) => {
          const completed =
            list.items.filter(
              (item) => item.done,
            ).length
          return (
            <article
              key={list.id}
              className={styles.card}
            >
              <header>
                <div>
                  <h2>{list.title}</h2>
                  <span>
                    {list.linkLabel ||
                      'Lista general'}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button type="button" onClick={() => openEdit(list)} aria-label="Editar lista">
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => deleteList(list.id)} aria-label="Eliminar lista">
                    <Trash2 size={16} />
                  </button>
                </div>
              </header>
              <p className={styles.progress}>
                {completed} de{' '}
                {list.items.length} listos
              </p>
              <div className={styles.items}>
                {list.items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      item.done
                        ? styles.done
                        : ''
                    }
                    onClick={() =>
                      toggleItem(
                        list,
                        item.id,
                      )
                    }
                  >
                    <span>
                      {item.done ? (
                        <Check size={15} />
                      ) : null}
                    </span>
                    {item.text}
                  </button>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <button
        type="button"
        className={styles.fab}
        onClick={() => { setEditingList(null); setOpen(true) }}
      >
        <Plus size={25} />
      </button>

      {open ? (
        <div className={styles.overlay}>
          <form
            className={styles.modal}
            onSubmit={save}
          >
            <header>
              <div>
                <span>Checklist</span>
                <h2>{editingList ? 'Editar lista' : 'Nueva lista'}</h2>
                <p>
                  Escribe lo que necesitas y
                  ve marcándolo.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
              >
                <X size={19} />
              </button>
            </header>
            <div className={styles.form}>
              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value,
                  )
                }
                placeholder="Nombre opcional"
              />
              <div className={styles.linkRow}>
                <select
                  value={linkType}
                  onChange={(event) => {
                    setLinkType(
                      event.target.value,
                    )
                    setLinkId('')
                  }}
                >
                  <option value="">
                    Lista general
                  </option>
                  <option value="cotizacion">
                    Vincular a cotización
                  </option>
                  <option value="servicio">
                    Vincular a servicio
                  </option>
                </select>
                {linkType ? (
                  <select
                    value={linkId}
                    onChange={(event) =>
                      setLinkId(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Seleccionar
                    </option>
                    {linkOptions.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.folio ||
                            item.title}
                        </option>
                      ),
                    )}
                  </select>
                ) : null}
              </div>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={styles.itemInput}
                >
                  <textarea
                    autoFocus={index === 0}
                    value={item.text}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map(
                          (currentItem) =>
                            currentItem.id ===
                            item.id
                              ? {
                                  ...currentItem,
                                  text: event
                                    .target
                                    .value,
                                }
                              : currentItem,
                        ),
                      )
                    }
                    placeholder="Ej. Rentar escalera"
                  />
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setItems((current) =>
                          current.filter(
                            (currentItem) =>
                              currentItem.id !==
                              item.id,
                          ),
                        )
                      }
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                className={styles.addItem}
                onClick={() =>
                  setItems((current) => [
                    ...current,
                    newItem(),
                  ])
                }
              >
                <Plus size={16} />
                Agregar renglón
              </button>
            </div>
            <footer>
              <button
                type="button"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button type="submit">
                {editingList ? 'Guardar cambios' : 'Guardar lista'}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </section>
  )
}

export default ListasPage
