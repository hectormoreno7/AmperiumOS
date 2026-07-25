import PageHeader from '../components/PageHeader/PageHeader'
import styles from './ModulePlaceholderPage.module.css'

function ModulePlaceholderPage({ title, description }) {
  return (
    <section className={styles.page}>
      <PageHeader title={title} description={description} />

      <div className={styles.placeholder}>
        <div className={styles.icon}>◇</div>

        <h2>Módulo en preparación</h2>

        <p>
          La estructura de navegación ya está lista. Este módulo se conectará
          posteriormente con Firebase y con las funciones de Amperium OS.
        </p>
      </div>
    </section>
  )
}

export default ModulePlaceholderPage