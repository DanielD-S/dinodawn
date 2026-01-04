export default function PvePanel({
  dinosaurs,
  creatures,
  attacks,
  selectedDinos,
  setSelectedDinos,
  onStartAttack,
  onResolveAttack,
  busyStartAttackId,
  busyResolveAttackId,
  now,
}) {
  const idleDinos = dinosaurs.filter((d) => d.status === "idle")

  return (
    <>
      <h2>PvE</h2>
      <p style={{ opacity: 0.75 }}>
        Selecciona dinosaurios <b>idle</b> y envíalos contra una criatura. (viaje ~25s)
      </p>

      <div style={{ marginTop: 8 }}>
        <p>
          <b>Selecciona dinosaurios (idle)</b>
        </p>

        {idleDinos.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No tienes dinos idle disponibles.</p>
        ) : (
          idleDinos.map((d) => (
            <label key={d.id} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={selectedDinos.includes(d.id)}
                onChange={(e) => {
                  setSelectedDinos((prev) =>
                    e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id)
                  )
                }}
                disabled={busyStartAttackId !== null}
              />{" "}
              {d.kind} (ATK {Math.floor(d.attack)} / DEF {Math.floor(d.defense)} / HP{" "}
              {Math.floor(d.hp)})
            </label>
          ))
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>Criaturas</h3>
        {creatures.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No hay criaturas cargadas (¿corriste seed?).</p>
        ) : (
          <ul>
            {creatures.map((c) => (
              <li key={c.id} style={{ marginBottom: 10 }}>
                <b>{c.name}</b> (lvl {c.level}, {c.biome}) — ATK {c.attack} / DEF{" "}
                {c.defense} / HP {c.hp}
                <br />
                Loot: 🌿{c.loot_plants} 🦴{c.loot_bones} 🍖{c.loot_meat} | ADN{" "}
                {Math.round(Number(c.dna_chance ?? 0) * 100)}%
                <br />
                <button
                  disabled={busyStartAttackId !== null || selectedDinos.length === 0}
                  onClick={() => onStartAttack(c.id)}
                >
                  {busyStartAttackId === c.id ? "Atacando..." : "Atacar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>Ataques</h3>
        {attacks.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No tienes ataques.</p>
        ) : (
          <ul>
            {attacks.map((a) => {
              const endsMs = new Date(a.travel_ends_at).getTime()
              const remaining = Math.max(0, Math.ceil((endsMs - now) / 1000))
              const canResolve = a.status !== "resolved" && remaining === 0
              const resolvingThis = busyResolveAttackId === a.id

              return (
                <li key={a.id} style={{ marginBottom: 10 }}>
                  <b>{a.pve_creatures?.name ?? "Criatura"}</b> — estado: {a.status}
                  {a.status !== "resolved" ? (
                    <span style={{ marginLeft: 8, opacity: 0.75 }}>
                      {canResolve ? "✅ listo para resolver" : `⏳ ${remaining}s`}
                    </span>
                  ) : null}
                  <br />
                  Fin viaje: {new Date(a.travel_ends_at).toLocaleTimeString()}
                  <br />
                  Dinos enviados: {a.dinosaur_ids?.length ?? 0}
                  <br />
                  <button
                    disabled={resolvingThis || !canResolve}
                    onClick={() => onResolveAttack(a.id)}
                  >
                    {resolvingThis ? "Resolviendo..." : "Resolver"}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
