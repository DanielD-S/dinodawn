function fmtTimeFromHours(hours) {
  if (hours === null || hours === undefined) return "—"
  if (hours === 0) return "Lleno"

  const totalSeconds = Math.max(0, Math.floor(hours * 3600))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function clampPct(x) {
  return Math.max(0, Math.min(100, x))
}

function Bar({ pct }) {
  const p = clampPct(pct)
  return (
    <div style={{ height: 10, borderRadius: 999, background: "#eee", overflow: "hidden" }}>
      <div style={{ width: `${p}%`, height: "100%", background: "#111" }} />
    </div>
  )
}

function Since({ lastSyncAt, now }) {
  if (!lastSyncAt) return <span style={{ opacity: 0.7 }}>Nunca</span>
  const sec = Math.max(0, Math.floor((now - lastSyncAt) / 1000))
  if (sec < 60) return <span>hace {sec}s</span>
  const min = Math.floor(sec / 60)
  const rem = sec % 60
  if (min < 60) return <span>hace {min}m {rem}s</span>
  const h = Math.floor(min / 60)
  const m = min % 60
  return <span>hace {h}h {m}m</span>
}

export default function ResourcesPanel({
  resources,
  storageCost,
  canUpgradeStorage,
  onCollect,
  onUpgradeStorage,
  busyCollect,
  busyUpgrade,
  ratesPerHour,
  storageUi,
  nextAutoInSeconds,
  lastSyncAt,
  now,
  syncing,
}) {
  const cap = storageUi?.cap ?? Math.floor(resources.storage_cap ?? 0)

  const rotateStyle = syncing
    ? { display: "inline-block", animation: "spin 0.9s linear infinite" }
    : { display: "inline-block" }

  // Si ya está al cap, producción efectiva visible = 0/h (porque no acumula más)
  const effRates = {
    wood: (resources.wood >= cap) ? 0 : ratesPerHour.wood,
    bones: (resources.bones >= cap) ? 0 : ratesPerHour.bones,
    food: (resources.food >= cap) ? 0 : ratesPerHour.food,
  }

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>

      <h2>Recursos</h2>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <div style={{ opacity: 0.8 }}>
          Auto-recolección activa • próxima sync en <b>{nextAutoInSeconds}s</b>
        </div>
        <div style={{ opacity: 0.8 }}>
          Última sincronización: <b><Since lastSyncAt={lastSyncAt} now={now} /></b>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>🌲 Madera: <b>{Math.floor(resources.wood)}</b> / {Math.floor(cap)}</div>
            <div style={{ opacity: 0.75 }}>{Math.floor(storageUi?.wPct ?? 0)}%</div>
          </div>
          <Bar pct={storageUi?.wPct ?? 0} />
          <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
            +{Math.floor(effRates.wood)}/h • Lleno en: <b>{fmtTimeFromHours(storageUi?.hoursToCap?.wood)}</b>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>🦴 Huesos: <b>{Math.floor(resources.bones)}</b> / {Math.floor(cap)}</div>
            <div style={{ opacity: 0.75 }}>{Math.floor(storageUi?.bPct ?? 0)}%</div>
          </div>
          <Bar pct={storageUi?.bPct ?? 0} />
          <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
            +{Math.floor(effRates.bones)}/h • Lleno en: <b>{fmtTimeFromHours(storageUi?.hoursToCap?.bones)}</b>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>🍖 Comida: <b>{Math.floor(resources.food)}</b> / {Math.floor(cap)}</div>
            <div style={{ opacity: 0.75 }}>{Math.floor(storageUi?.fPct ?? 0)}%</div>
          </div>
          <Bar pct={storageUi?.fPct ?? 0} />
          <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
            +{Math.floor(effRates.food)}/h • Lleno en: <b>{fmtTimeFromHours(storageUi?.hoursToCap?.food)}</b>
          </div>
        </div>

        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>📦 Almacén (máximo llenado)</div>
            <div style={{ opacity: 0.75 }}>{Math.floor(storageUi?.maxPct ?? 0)}%</div>
          </div>
          <Bar pct={storageUi?.maxPct ?? 0} />
          <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
            Cap actual: <b>{Math.floor(resources.storage_cap)}</b>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
        <button onClick={onCollect} disabled={busyCollect} title="Fuerza una actualización inmediata con el servidor">
          <span style={rotateStyle}>🔄</span> {busyCollect ? "Sincronizando..." : "Sincronizar"}
        </button>

        <button onClick={onUpgradeStorage} disabled={busyUpgrade || !canUpgradeStorage}>
          {busyUpgrade
            ? "Mejorando..."
            : `Mejorar almacén (→ 📦 ${storageCost ? Math.floor(storageCost.next_cap) : "..."})`}
        </button>
      </div>

      {storageCost ? (
        <div style={{ marginTop: 10, opacity: 0.9 }}>
          Almacén lvl <b>{storageCost.current_level}</b> → <b>{storageCost.next_level}</b> | Próxima cap: 📦{" "}
          <b>{Math.floor(storageCost.next_cap)}</b>
          <br />
          Costo mejora: 🌲 {Math.floor(storageCost.wood_cost)} / 🦴 {Math.floor(storageCost.bones_cost)} / 🍖{" "}
          {Math.floor(storageCost.food_cost)}
        </div>
      ) : (
        <p style={{ marginTop: 10, opacity: 0.85 }}>Cargando costo del almacén...</p>
      )}

      {storageCost && !canUpgradeStorage && (
        <p style={{ marginTop: 6, opacity: 0.65 }}>
          Te faltan recursos para mejorar el almacén.
        </p>
      )}
    </>
  )
}
