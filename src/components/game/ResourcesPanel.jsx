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
  onCollect,
  busyCollect,
  ratesPerHour,
  storageUi,
  nextAutoInSeconds,
  lastSyncAt,
  now,
  syncing,
  autoSyncSeconds,
}) {
  const cap = Math.max(1, Number(storageUi?.cap ?? resources.storage_cap ?? 1))

  const rotateStyle = syncing
    ? { display: "inline-block", animation: "spin 0.9s linear infinite" }
    : { display: "inline-block" }

  const plantsNow = Number(resources.plants ?? 0)
  const bonesNow = Number(resources.bones ?? 0)
  const meatNow = Number(resources.meat ?? 0)

  // Si ya está al cap, producción efectiva visible = 0/h
  const effRates = {
    plants: plantsNow >= cap ? 0 : Number(ratesPerHour?.plants ?? 0),
    bones: bonesNow >= cap ? 0 : Number(ratesPerHour?.bones ?? 0),
    meat: meatNow >= cap ? 0 : Number(ratesPerHour?.meat ?? 0),
  }

  function getLeadKey() {
    const capVal = Math.max(1, Number(cap || 1))
    const pPct = (plantsNow / capVal) * 100
    const bPct = (bonesNow / capVal) * 100
    const mPct = (meatNow / capVal) * 100

    let leadKey = "plants"
    let leadPct = pPct
    if (bPct > leadPct) { leadKey = "bones"; leadPct = bPct }
    if (mPct > leadPct) { leadKey = "meat"; leadPct = mPct }
    return leadKey
  }

  const leadKey = getLeadKey()
  const leadLabel =
    leadKey === "plants" ? "🌿 Plantas" :
    leadKey === "bones" ? "🦴 Huesos" :
    "🍖 Carne"

  const leadHours = storageUi?.hoursToCap?.[leadKey]

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>

      <h2>Recursos</h2>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <div style={{ opacity: 0.8 }}>
          Auto-recolección activa • próxima sync en <b>{nextAutoInSeconds}s</b>
          {autoSyncSeconds ? <span style={{ opacity: 0.8 }}> (cada {autoSyncSeconds}s)</span> : null}
        </div>
        <div style={{ opacity: 0.8 }}>
          Última sincronización: <b><Since lastSyncAt={lastSyncAt} now={now} /></b>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>🌿 Plantas: <b>{Math.floor(plantsNow)}</b> / {Math.floor(cap)}</div>
            <div style={{ opacity: 0.75 }}>{Math.floor(storageUi?.pPct ?? 0)}%</div>
          </div>
          <Bar pct={storageUi?.pPct ?? 0} />
          <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
            +{Math.floor(effRates.plants)}/h • Lleno en: <b>{fmtTimeFromHours(storageUi?.hoursToCap?.plants)}</b>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>🦴 Huesos: <b>{Math.floor(bonesNow)}</b> / {Math.floor(cap)}</div>
            <div style={{ opacity: 0.75 }}>{Math.floor(storageUi?.bPct ?? 0)}%</div>
          </div>
          <Bar pct={storageUi?.bPct ?? 0} />
          <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
            +{Math.floor(effRates.bones)}/h • Lleno en: <b>{fmtTimeFromHours(storageUi?.hoursToCap?.bones)}</b>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>🍖 Carne: <b>{Math.floor(meatNow)}</b> / {Math.floor(cap)}</div>
            <div style={{ opacity: 0.75 }}>{Math.floor(storageUi?.mPct ?? 0)}%</div>
          </div>
          <Bar pct={storageUi?.mPct ?? 0} />
          <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
            +{Math.floor(effRates.meat)}/h • Lleno en: <b>{fmtTimeFromHours(storageUi?.hoursToCap?.meat)}</b>
          </div>
        </div>

        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>📦 Caverna de Acopio (máximo llenado)</div>
            <div style={{ opacity: 0.75 }}>{Math.floor(storageUi?.maxPct ?? 0)}%</div>
          </div>

          <Bar pct={storageUi?.maxPct ?? 0} />

          <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
            Cap actual: <b>{Math.floor(Number(resources.storage_cap ?? cap))}</b> • Se llena primero: <b>{leadLabel}</b>
            <br />
            Lleno en: <b>{fmtTimeFromHours(leadHours)}</b>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
        <button onClick={onCollect} disabled={busyCollect} title="Fuerza una actualización inmediata con el servidor">
          <span style={rotateStyle}>🔄</span> {busyCollect ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>
    </>
  )
}
