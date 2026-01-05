import "../../styles/BuildingsPanel.css"


const BUILDING_LABELS = {
  bosque_domado: "🌿 Bosque Domado",
  nido_caza: "🍖 Nido de Caza",
  deposito_restos: "🦴 Depósito de Restos",
  caverna_acopio: "📦 Caverna de Acopio",
  fosa_dominio: "🦖 Fosa de Dominio",
  santuario_incubacion: "🥚 Santuario de Incubación",
  fortaleza_colmillos: "🏰 Fortaleza de Colmillos",
  torre_vigilancia: "🗼 Torre de Vigilancia",
  circulo_fuego: "🔥 Círculo de Fuego",
  zona_trueque: "🔁 Zona de Trueque",
  totem_tribu: "🗿 Tótem de Tribu",
}

function n(x) {
  const v = Number(x)
  return Number.isFinite(v) ? v : 0
}

function getProductionLines(buildingType, pph, bph, mph) {
  if (buildingType === "bosque_domado") return [{ value: pph, icon: "🌿" }]
  if (buildingType === "deposito_restos") return [{ value: bph, icon: "🦴" }]
  if (buildingType === "nido_caza") return [{ value: mph, icon: "🍖" }]
  return [
    { value: pph, icon: "🌿" },
    { value: bph, icon: "🦴" },
    { value: mph, icon: "🍖" },
  ].filter((x) => n(x.value) > 0)
}

function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(n(totalSeconds)))
  const hh = String(Math.floor(s / 3600)).padStart(2, "0")
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0")
  const ss = String(s % 60).padStart(2, "0")
  return `${hh}:${mm}:${ss}`
}

function etaSeconds({ haveP, haveB, haveM, costP, costB, costM, rateP, rateB, rateM }) {
  const needP = Math.max(0, costP - haveP)
  const needB = Math.max(0, costB - haveB)
  const needM = Math.max(0, costM - haveM)

  function t(need, ratePerHour) {
    if (need <= 0) return 0
    if (!ratePerHour || ratePerHour <= 0) return null
    return (need / ratePerHour) * 3600
  }

  const tp = t(needP, rateP)
  const tb = t(needB, rateB)
  const tm = t(needM, rateM)

  if ((needP > 0 && tp === null) || (needB > 0 && tb === null) || (needM > 0 && tm === null)) {
    return null
  }

  return Math.max(tp ?? 0, tb ?? 0, tm ?? 0)
}

function clampToCap(value, cap) {
  if (!Number.isFinite(cap) || cap <= 0) return value
  return Math.min(cap, value)
}

export default function BuildingsPanel({
  buildings = [],
  resources = null,
  ratesPerHour = null, // { plants, bones, meat }
  now, // ms
  lastSyncAt, // ms
  onUpgrade,
  busyUpgradeType,
}) {
  if (!Array.isArray(buildings) || buildings.length === 0) {
    return (
      <section className="tribal-panel buildings-panel">
        <div className="tribal-panel__head">
          <h2 className="tribal-title">🏗️ Edificios</h2>
        </div>
        <div className="tribal-divider" />
        <p className="tribal-muted">No tienes edificios cargados.</p>
      </section>
    )
  }

  // Snapshot (última sync real desde BD)
  const snapP = n(resources?.plants)
  const snapB = n(resources?.bones)
  const snapM = n(resources?.meat)
  const cap = n(resources?.storage_cap)

  // Producción total jugador
  const rateP = n(ratesPerHour?.plants)
  const rateB = n(ratesPerHour?.bones)
  const rateM = n(ratesPerHour?.meat)

  // ⏱️ Estimación “en vivo” desde el último sync
  const elapsedSec = lastSyncAt ? Math.max(0, (n(now) - n(lastSyncAt)) / 1000) : 0

  const liveP = clampToCap(snapP + (rateP / 3600) * elapsedSec, cap)
  const liveB = clampToCap(snapB + (rateB / 3600) * elapsedSec, cap)
  const liveM = clampToCap(snapM + (rateM / 3600) * elapsedSec, cap)

  return (
    <section className="tribal-panel buildings-panel">
      <div className="tribal-panel__head">
        <h2 className="tribal-title">🏗️ Edificios</h2>

        <div className="buildings-panel__meta">
          <span className="chip">Cap: <b>{Math.floor(cap || 0)}</b> 📦</span>
          <span className="chip">Vivo: <b>{Math.floor(liveP)}</b> 🌿 · <b>{Math.floor(liveB)}</b> 🦴 · <b>{Math.floor(liveM)}</b> 🍖</span>
        </div>
      </div>

      <div className="tribal-divider" />

      <ul className="buildings-list">
        {buildings.map((b) => {
          const name = BUILDING_LABELS[b.building_type] ?? b.building_type
          const busy = busyUpgradeType === b.building_type

          // Producción del edificio (solo para mostrar)
          const pph = n(b.prod_plants_per_hour)
          const bph = n(b.prod_bones_per_hour)
          const mph = n(b.prod_meat_per_hour)
          const prodLines = getProductionLines(b.building_type, pph, bph, mph)
          const hasProd = prodLines.length > 0

          // Costos
          const cp = Math.floor(n(b.cost_plants))
          const cb = Math.floor(n(b.cost_bones))
          const cm = Math.floor(n(b.cost_meat))

          const canUpgrade = !b.is_max && !!b.can_upgrade

          // ✅ canAfford usando recursos EN VIVO (no congelados)
          const canAffordLive = liveP >= cp && liveB >= cb && liveM >= cm

          // ETA también usando recursos EN VIVO
          const eta =
            !canAffordLive && canUpgrade
              ? etaSeconds({
                  haveP: liveP,
                  haveB: liveB,
                  haveM: liveM,
                  costP: cp,
                  costB: cb,
                  costM: cm,
                  rateP,
                  rateB,
                  rateM,
                })
              : 0

          const disabled = !canUpgrade || busy || !canAffordLive

          let buttonText = "Mejorar"
          if (b.is_max) buttonText = "Nivel máximo"
          else if (busy) buttonText = "Mejorando..."
          else if (!canUpgrade) buttonText = "No mejorable"
          else if (canAffordLive) buttonText = "✅ Mejorar"
          else buttonText = eta === null ? "Falta producción" : `⏳ Disponible en ${formatHMS(eta)}`

          return (
            <li key={b.id ?? b.building_type} className={`building-card ${b.is_max ? "is-max" : ""}`}>
              <div className="building-card__top">
                <div className="building-card__title">
                  <div className="building-name">{name}</div>
                  <div className="building-level">
                    Nivel <b>{b.level}</b> {b.is_max ? <span className="tag">MAX</span> : null}
                  </div>
                </div>

                <div className="building-card__badge">
                  <span className={`badge ${canAffordLive ? "ok" : "warn"}`}>
                    {canAffordLive ? "LISTO" : "EN PROGRESO"}
                  </span>
                </div>
              </div>

              <div className="building-card__row">
                {hasProd ? (
                  <div className="line">
                    <span className="label">Producción</span>
                    <span className="value">
                      {prodLines.map((x, idx) => (
                        <span key={x.icon} className="mono">
                          +{Math.floor(n(x.value))} {x.icon}/h
                          {idx < prodLines.length - 1 ? <span className="sep"> · </span> : null}
                        </span>
                      ))}
                    </span>
                  </div>
                ) : (
                  <div className="line">
                    <span className="label">Producción</span>
                    <span className="value muted">No produce recursos</span>
                  </div>
                )}
              </div>

              {canUpgrade ? (
                <div className="building-card__row">
                  <div className="line">
                    <span className="label">Costo</span>
                    <span className="value">
                      <b>{cp}</b> 🌿 <span className="sep">·</span> <b>{cb}</b> 🦴 <span className="sep">·</span> <b>{cm}</b> 🍖
                    </span>
                  </div>

                  {!canAffordLive && (
                    <div className="hint">
                      ❌ No alcanza con tus recursos actuales.
                      {eta ? <span className="hint__eta"> ({eta === null ? "sin ETA" : `ETA ${formatHMS(eta)}`})</span> : null}
                    </div>
                  )}
                </div>
              ) : (
                !b.is_max && (
                  <div className="building-card__row">
                    <div className="hint">Este edificio es de nivel único.</div>
                  </div>
                )
              )}

              <div className="building-card__actions">
                <button
                  className="tribal-btn"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return
                    onUpgrade?.(b.building_type)
                  }}
                  aria-label={`Mejorar ${name}`}
                >
                  {buttonText}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
