import styles from './StatCard.module.css'

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendType = 'neutral',
}) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.icon}>{icon}</div>

        {trend && (
          <span
            className={`${styles.trend} ${
              styles[`trend${trendType}`]
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      <strong className={styles.value}>{value}</strong>
      <h3>{title}</h3>

      {description && <p>{description}</p>}
    </article>
  )
}

export default StatCard