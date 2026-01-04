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
  // Mostrar SOLO el recurso del edificio (y evitar confusión de "3 a la vez")
  if (buildingType === "bosque_domado") return [{ value: pph, icon: "🌿" }]
  if (buildingType === "deposito_restos") return [{ value: bph, icon: "🦴" }]
  if (buildingType === "nido_caza") return [{ value: mph, icon: "🍖" }]

  // Para otros edificios: si algún día producen, mostrar solo los > 0
  return [
    { value: pph, icon: "🌿" },
    { value: bph, icon: "🦴" },
    { value: mph, icon: "🍖" },
  ].filter((x) => n(x.value) > 0)
}

export default function BuildingsPanel({
  buildings = [],
  resources = null,
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

  const haveP = n(resources?.plants)
  const haveB = n(resources?.bones)
  const haveM = n(resources?.meat)

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

          const prodLines = getProductionLines(b.building_type, pph, bph, mph)
          const hasProd = prodLines.length > 0

          const cp = Math.floor(n(b.cost_plants))
          const cb = Math.floor(n(b.cost_bones))
          const cm = Math.floor(n(b.cost_meat))

          const canUpgrade = !b.is_max && !!b.can_upgrade
          const canAfford = haveP >= cp && haveB >= cb && haveM >= cm

          const disabled = !canUpgrade || busy || !canAfford

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

              {canUpgrade && !canAfford && (
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
                  {b.is_max
                    ? "Nivel máximo"
                    : busy
                    ? "Mejorando..."
                    : !canAfford
                    ? "Recursos insuficientes"
                    : "Mejorar"}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
