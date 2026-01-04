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
      <div>
        <h2>🏗️ Edificios</h2>
        <p style={{ opacity: 0.75 }}>No tienes edificios cargados.</p>
      </div>
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
    <div>
      <h2>🏗️ Edificios</h2>

      <ul style={{ paddingLeft: 18 }}>
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
          const eta = !canAffordLive && canUpgrade
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
            <li key={b.id ?? b.building_type} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800 }}>
                {name} — Nivel {b.level} {b.is_max ? "(MAX)" : ""}
              </div>

              {hasProd ? (
                <div style={{ opacity: 0.85, marginTop: 4 }}>
                  Producción:{" "}
                  <b>
                    {prodLines.map((x, idx) => (
                      <span key={x.icon}>
                        +{Math.floor(n(x.value))} {x.icon}/h
                        {idx < prodLines.length - 1 ? " · " : ""}
                      </span>
                    ))}
                  </b>
                </div>
              ) : (
                <div style={{ opacity: 0.75, marginTop: 4 }}>No produce recursos.</div>
              )}

              {canUpgrade && (
                <div style={{ opacity: 0.85, marginTop: 4 }}>
                  Costo mejora:{" "}
                  <b>
                    {cp} 🌿 · {cb} 🦴 · {cm} 🍖
                  </b>
                </div>
              )}

              {!b.can_upgrade && !b.is_max && (
                <div style={{ opacity: 0.75, marginTop: 4 }}>
                  Este edificio es de nivel único.
                </div>
              )}

              {canUpgrade && !canAffordLive && (
                <div style={{ opacity: 0.75, marginTop: 4 }}>
                  ❌ No alcanza con tus recursos actuales.
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <button
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return
                    onUpgrade?.(b.building_type)
                  }}
                >
                  {buttonText}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
