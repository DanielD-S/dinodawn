const BUILDING_LABELS = {
  sawmill: "🪵 Aserradero",
  bonepit: "🦴 Hoyo de Huesos",
  farm: "🍖 Granja",
}

function n(x) {
  // convierte numeric/string/null a número seguro
  const v = Number(x)
  return Number.isFinite(v) ? v : 0
}

export default function BuildingsPanel({ buildings = [], onUpgrade, busyUpgradeType }) {
  if (!Array.isArray(buildings) || buildings.length === 0) {
    return (
      <div>
        <h2>🏗️ Edificios</h2>
        <p style={{ opacity: 0.75 }}>No tienes edificios cargados.</p>
      </div>
    )
  }

  return (
    <div>
      <h2>🏗️ Edificios</h2>

      <ul style={{ paddingLeft: 18 }}>
        {buildings.map((b) => {
          const name = BUILDING_LABELS[b.building_type] ?? b.building_type
          const busy = busyUpgradeType === b.building_type

          const wph = n(b.prod_wood_per_hour)
          const bph = n(b.prod_bones_per_hour)
          const fph = n(b.prod_food_per_hour)

          const cw = n(b.cost_wood)
          const cb = n(b.cost_bones)
          const cf = n(b.cost_food)

          return (
            <li key={b.id} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800 }}>
                {name} — Nivel {b.level} {b.is_max ? "(MAX)" : ""}
              </div>

              <div style={{ opacity: 0.85, marginTop: 4 }}>
                Producción:{" "}
                <b>
                  +{Math.floor(wph)} 🌲/h · +{Math.floor(bph)} 🦴/h · +{Math.floor(fph)} 🍖/h
                </b>
              </div>

              {!b.is_max && (
                <div style={{ opacity: 0.85, marginTop: 4 }}>
                  Costo mejora:{" "}
                  <b>
                    {Math.floor(cw)} 🌲 · {Math.floor(cb)} 🦴 · {Math.floor(cf)} 🍖
                  </b>
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <button disabled={b.is_max || busy} onClick={() => onUpgrade?.(b.building_type)}>
                  {b.is_max ? "Nivel máximo" : busy ? "Mejorando..." : "Mejorar"}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
