import styles from "./ClientsToolbar.module.css";

export default function ClientsToolbar({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
}) {
    return (
        <section className={styles.toolbar}>
            <div className={styles.searchContainer}>
                <span className={styles.searchIcon}>⌕</span>

                <input
                    className={styles.search}
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por cliente, teléfono, correo o referencia..."
                />
            </div>

            <select
                className={styles.filter}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
            >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
            </select>
        </section>
    );
}