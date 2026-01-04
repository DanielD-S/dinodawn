export default function ResourcesPanel({
  resources,
  storageCost,
  canUpgradeStorage,
  onCollect,
  onUpgradeStorage,
  busyCollect,
  busyUpgrade,
}) {
  return (
    <>
      <h2>Recursos</h2>
      <ul>
        <li>🌲 Madera: {Math.floor(resources.wood)}</li>
        <li>🦴 Huesos: {Math.floor(resources.bones)}</li>
        <li>🍖 Comida: {Math.floor(resources.food)}</li>
        <li>📦 Cap: {Math.floor(resources.storage_cap)}</li>
      </ul>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={onCollect} disabled={busyCollect}>
          {busyCollect ? "Recolectando..." : "Actualizar / Recolectar"}
        </button>

        <button onClick={onUpgradeStorage} disabled={busyUpgrade || !canUpgradeStorage}>
          {busyUpgrade
            ? "Mejorando..."
            : `Mejorar almacén (→ 📦 ${storageCost ? Math.floor(storageCost.next_cap) : "..."})`}
        </button>
      </div>

      {storageCost ? (
        <p style={{ marginTop: 10, opacity: 0.85 }}>
          Almacén lvl <b>{storageCost.current_level}</b> → <b>{storageCost.next_level}</b> | Próxima cap: 📦{" "}
          <b>{Math.floor(storageCost.next_cap)}</b>
          <br />
          Costo mejora: 🌲 {Math.floor(storageCost.wood_cost)} / 🦴 {Math.floor(storageCost.bones_cost)} / 🍖{" "}
          {Math.floor(storageCost.food_cost)}
        </p>
      ) : (
        <p style={{ marginTop: 10, opacity: 0.85 }}>Cargando costo del almacén...</p>
      )}

      {storageCost && !canUpgradeStorage && (
        <p style={{ marginTop: 4, opacity: 0.65 }}>
          Te faltan recursos para mejorar el almacén.
        </p>
      )}
    </>
  )
}
