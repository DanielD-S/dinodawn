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

          const pph = n(b.prod_plants_per_hour)
          const bph = n(b.prod_bones_per_hour)
          const mph = n(b.prod_meat_per_hour)
          const totalProd = pph + bph + mph

          const cp = n(b.cost_plants)
          const cb = n(b.cost_bones)
          const cm = n(b.cost_meat)

          return (
            <li key={b.id ?? b.building_type} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800 }}>
                {name} — Nivel {b.level} {b.is_max ? "(MAX)" : ""}
              </div>

              {totalProd > 0 ? (
                <div style={{ opacity: 0.85, marginTop: 4 }}>
                  Producción:{" "}
                  <b>
                    +{Math.floor(pph)} 🌿/h · +{Math.floor(bph)} 🦴/h · +{Math.floor(mph)} 🍖/h
                  </b>
                </div>
              ) : (
                <div style={{ opacity: 0.75, marginTop: 4 }}>No produce recursos.</div>
              )}

              {!b.is_max && b.can_upgrade && (
                <div style={{ opacity: 0.85, marginTop: 4 }}>
                  Costo mejora:{" "}
                  <b>
                    {Math.floor(cp)} 🌿 · {Math.floor(cb)} 🦴 · {Math.floor(cm)} 🍖
                  </b>
                </div>
              )}

              {!b.can_upgrade && !b.is_max && (
                <div style={{ opacity: 0.75, marginTop: 4 }}>
                  Este edificio es de nivel único.
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <button
                  disabled={b.is_max || !b.can_upgrade || busy}
                  onClick={() => {
                    if (b.is_max || !b.can_upgrade || busy) return
                    onUpgrade?.(b.building_type)
                  }}
                >
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
