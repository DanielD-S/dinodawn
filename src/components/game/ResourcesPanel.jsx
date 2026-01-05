import "../../styles/ResourcesPanel.css"

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
    <div className="rbar">
      <div className="rbar__fill" style={{ width: `${p}%` }} />
    </div>
  )
}

function Since({ lastSyncAt, now }) {
  if (!lastSyncAt) return <span className="muted">Nunca</span>
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
    <section className="tribal-panel resources-panel">
      <div className="resources-head">
        <h2 className="tribal-title">📦 Recursos</h2>

        <div className="resources-chips">
          <span className="chip">
            Auto-recolección: <b>{nextAutoInSeconds}s</b>
            {autoSyncSeconds ? <span className="muted"> (cada {autoSyncSeconds}s)</span> : null}
          </span>

          <span className="chip">
            Última sync: <b><Since lastSyncAt={lastSyncAt} now={now} /></b>
          </span>

          <span className="chip">
            Cap: <b>{Math.floor(cap)}</b>
          </span>
        </div>
      </div>

      <div className="tribal-divider" />

      <div className="resources-grid">
        {/* PLANTS */}
        <div className="res-card">
          <div className="res-row">
            <div className="res-left">🌿 Plantas: <b>{Math.floor(plantsNow)}</b> <span className="muted">/ {Math.floor(cap)}</span></div>
            <div className="res-right muted">{Math.floor(storageUi?.pPct ?? 0)}%</div>
          </div>

          <Bar pct={storageUi?.pPct ?? 0} />

          <div className="res-sub">
            +{Math.floor(effRates.plants)}/h <span className="dot">•</span> Lleno en: <b>{fmtTimeFromHours(storageUi?.hoursToCap?.plants)}</b>
          </div>
        </div>

        {/* BONES */}
        <div className="res-card">
          <div className="res-row">
            <div className="res-left">🦴 Huesos: <b>{Math.floor(bonesNow)}</b> <span className="muted">/ {Math.floor(cap)}</span></div>
            <div className="res-right muted">{Math.floor(storageUi?.bPct ?? 0)}%</div>
          </div>

          <Bar pct={storageUi?.bPct ?? 0} />

          <div className="res-sub">
            +{Math.floor(effRates.bones)}/h <span className="dot">•</span> Lleno en: <b>{fmtTimeFromHours(storageUi?.hoursToCap?.bones)}</b>
          </div>
        </div>

        {/* MEAT */}
        <div className="res-card">
          <div className="res-row">
            <div className="res-left">🍖 Carne: <b>{Math.floor(meatNow)}</b> <span className="muted">/ {Math.floor(cap)}</span></div>
            <div className="res-right muted">{Math.floor(storageUi?.mPct ?? 0)}%</div>
          </div>

          <Bar pct={storageUi?.mPct ?? 0} />

          <div className="res-sub">
            +{Math.floor(effRates.meat)}/h <span className="dot">•</span> Lleno en: <b>{fmtTimeFromHours(storageUi?.hoursToCap?.meat)}</b>
          </div>
        </div>

        {/* STORAGE */}
        <div className="res-card storage-card">
          <div className="res-row">
            <div className="res-left">📦 Caverna de Acopio (máximo llenado)</div>
            <div className="res-right muted">{Math.floor(storageUi?.maxPct ?? 0)}%</div>
          </div>

          <Bar pct={storageUi?.maxPct ?? 0} />

          <div className="res-sub">
            Cap actual: <b>{Math.floor(Number(resources.storage_cap ?? cap))}</b>
            <span className="dot">•</span> Se llena primero: <b>{leadLabel}</b>
            <br />
            Lleno en: <b>{fmtTimeFromHours(leadHours)}</b>
          </div>
        </div>
      </div>

      <div className="resources-actions">
        <button
          className={`tribal-btn ${syncing ? "is-syncing" : ""}`}
          onClick={onCollect}
          disabled={busyCollect}
          title="Fuerza una actualización inmediata con el servidor"
        >
          <span className={`sync-icon ${syncing ? "spin" : ""}`}>🔄</span>
          {busyCollect ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>
    </section>
  )
}
