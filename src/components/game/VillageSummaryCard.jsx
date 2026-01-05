import "./VillageSummaryCard.css"
import heroImg from "../../assets/hero/village-hero.png"

function n(x) {
  const v = Number(x)
  return Number.isFinite(v) ? v : 0
}

function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (x) => String(x).padStart(2, "0")
  if (h > 0) return `${h}h ${pad(m)}m ${pad(ss)}s`
  return `${m}m ${pad(ss)}s`
}

function pickFirstToCap(storageUi) {
  if (!storageUi?.hoursToCap) return null
  const entries = Object.entries(storageUi.hoursToCap)
    .filter(([, h]) => h !== null && h !== undefined)
    .map(([k, h]) => [k, Number(h)])
  if (!entries.length) return null
  entries.sort((a, b) => a[1] - b[1])
  const [resKey, hours] = entries[0]
  return { resKey, hours }
}

function resLabel(key) {
  if (key === "plants") return "🌿 Plantas"
  if (key === "bones") return "🦴 Huesos"
  if (key === "meat") return "🍖 Carne"
  return key
}

function clampPct(x) {
  return Math.max(0, Math.min(100, x))
}

export default function VillageSummaryCard({
  villageName = "Mi Aldea",
  resources = null,
  ratesPerHour = { plants: 0, bones: 0, meat: 0 },
  storageUi = null,
  now = Date.now(),
  nextAutoInSeconds = null,
  autoSyncSeconds = null,
  onGoBuildings,
}) {
  const cap = n(resources?.storage_cap) || 1

  const p = n(resources?.plants)
  const b = n(resources?.bones)
  const m = n(resources?.meat)

  const pPct = Math.min(100, Math.max(0, (p / cap) * 100))
  const bPct = Math.min(100, Math.max(0, (b / cap) * 100))
  const mPct = Math.min(100, Math.max(0, (m / cap) * 100))
  const maxPct = Math.max(pPct, bPct, mPct)

  const pph = n(ratesPerHour?.plants)
  const bph = n(ratesPerHour?.bones)
  const mph = n(ratesPerHour?.meat)
  const totalPH = pph + bph + mph

  const firstToCap = pickFirstToCap(storageUi)

  let recTitle = "Mejoras recomendadas"
  let recDesc = "Sube niveles para aumentar producción y progreso."
  let recTag = "📌"
  if (maxPct >= 85) {
    recTitle = "Recomendación"
    recTag = "⚠️"
    recDesc = "Tu almacén está cerca del límite. Prioriza mejorar la Caverna de Acopio."
  }

  const barClass =
    maxPct >= 90 ? "vscBarFill danger" : maxPct >= 70 ? "vscBarFill warn" : "vscBarFill"

  const syncInfo =
    typeof nextAutoInSeconds === "number" && typeof autoSyncSeconds === "number"
      ? `Auto-sync: ${nextAutoInSeconds}s (cada ${autoSyncSeconds}s)`
      : null

  const wobble = (Math.floor(now / 1000) % 20) * 2

  // HUD Producción (por dominancia)
  const maxR = Math.max(pph, bph, mph, 1)
  const hudP = clampPct((pph / maxR) * 100)
  const hudB = clampPct((bph / maxR) * 100)
  const hudM = clampPct((mph / maxR) * 100)

  return (
    <section className="tribal-panel vscCard" style={{ ["--wobble"]: `${wobble}%` }}>
      {/* HERO (imagen) */}
      <div
        className="vscHeroArt vscHeroArt--bg"
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-hidden="true"
      >
        <div className="vscHeroOverlay" />

        <div className="vscHeroHud">
          <div className="vscHudTitle">Producción</div>

          <div className="vscHudBar">
            <span className="vscHudIcon">🌿</span>
            <div className="vscHudTrack">
              <div className="vscHudFill is-plants" style={{ width: `${Math.max(6, hudP)}%` }} />
            </div>
          </div>

          <div className="vscHudBar">
            <span className="vscHudIcon">🦴</span>
            <div className="vscHudTrack">
              <div className="vscHudFill is-bones" style={{ width: `${Math.max(6, hudB)}%` }} />
            </div>
          </div>

          <div className="vscHudBar">
            <span className="vscHudIcon">🍖</span>
            <div className="vscHudTrack">
              <div className="vscHudFill is-meat" style={{ width: `${Math.max(6, hudM)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* PANEL */}
      <div className="vscHero">
        <div className="vscHeroTop">
          <div className="vscTitleRow">
            <div className="vscTitle">🏡 {villageName}</div>
            <div className="vscMeta">{syncInfo ?? " "}</div>
          </div>

          <div className="vscKpis">
            <div className="vscKpi">
              <div className="vscKpiLabel">Producción total</div>
              <div className="vscKpiValue">
                🌿 +{Math.floor(pph)}/h · 🦴 +{Math.floor(bph)}/h · 🍖 +{Math.floor(mph)}/h
              </div>
            </div>

            <div className="vscKpi">
              <div className="vscKpiLabel">Almacenamiento</div>
              <div className="vscKpiValue">
                {Math.floor(p)} / {Math.floor(cap)} 🌿 · {Math.floor(b)} / {Math.floor(cap)} 🦴 ·{" "}
                {Math.floor(m)} / {Math.floor(cap)} 🍖
              </div>
            </div>
          </div>
        </div>

        <div className="vscBar">
          <div className={barClass} style={{ width: `${Math.min(100, maxPct)}%` }} />
        </div>

        <div className="vscHeroBottom">
          <div className="vscHint">
            {firstToCap ? (
              <>
                ⏳ Se llena primero: <b>{resLabel(firstToCap.resKey)}</b>{" "}
                {firstToCap.hours <= 0 ? (
                  <span className="vscDanger">— ¡lleno!</span>
                ) : (
                  <span>
                    en <b>{formatHMS(firstToCap.hours * 3600)}</b>
                  </span>
                )}
              </>
            ) : totalPH > 0 ? (
              <>⏳ Produciendo... (sin datos de “tiempo a tope”)</>
            ) : (
              <>🪵 Aún no tienes producción. Mejora edificios de recursos.</>
            )}
          </div>

          <div className="vscActions">
            <button className="tribal-btn vscBtn" onClick={() => onGoBuildings?.()} type="button">
              🏗️ Ir a edificios
            </button>
          </div>
        </div>
      </div>

      <div className="vscRec">
        <div className="vscRecLeft">
          <div className="vscRecTitle">
            {recTag} {recTitle}
          </div>
          <div className="vscRecDesc">{recDesc}</div>
        </div>

        <div className="vscRecRight">
          <div className="vscChip">{totalPH > 0 ? `+${Math.floor(totalPH)}/h total` : "Sin producción"}</div>
        </div>
      </div>
    </section>
  )
}
