import styles from './PageHeader.module.css'

function PageHeader({
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className={styles.header}>
      <div>
        <h2>{title}</h2>

        {description && <p>{description}</p>}
      </div>

      {actionLabel && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={onAction}
        >
          <span>+</span>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default PageHeader