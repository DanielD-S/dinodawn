const TRAINING_OPTIONS = [
  { kind: "theropod", label: "🦖 Terópodo", role: "Ataque" },
  { kind: "herbivore", label: "🦕 Herbívoro", role: "Defensa" },
  { kind: "flyer", label: "🦅 Volador", role: "Exploración" },
  { kind: "aquatic", label: "🐊 Acuático", role: "Zonas especiales" },
]

export default function DinosaursPanel({
  dinosaurs,
  trainingCount,
  onTrain,
  onClaim,
  busyTrainKind,
  busyClaim,
}) {
  return (
    <>
      <h2>Dinosaurios</h2>
      <p style={{ marginTop: 6, opacity: 0.75 }}>
        Entrenando ahora: <b>{trainingCount}</b>
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {TRAINING_OPTIONS.map((opt) => (
          <button
            key={opt.kind}
            disabled={busyTrainKind !== null}
            onClick={() => onTrain(opt.kind)}
          >
            {busyTrainKind === opt.kind
              ? "Entrenando..."
              : `Entrenar ${opt.label} (${opt.role})`}
          </button>
        ))}

        <button disabled={busyClaim} onClick={onClaim}>
          {busyClaim ? "Reclamando..." : "Reclamar entrenados"}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        {dinosaurs.length === 0 ? (
          <p style={{ opacity: 0.7 }}>Aún no tienes dinosaurios.</p>
        ) : (
          <ul>
            {dinosaurs.map((d) => {
              const ends = d.training_ends_at ? new Date(d.training_ends_at) : null
              return (
                <li key={d.id}>
                  <b>{d.kind}</b> — lvl {d.level} — {d.status}
                  {d.status === "training" && ends
                    ? ` (termina: ${ends.toLocaleTimeString()})`
                    : ""}
                  {" | "}ATK {Math.floor(d.attack)} / DEF {Math.floor(d.defense)} / HP{" "}
                  {Math.floor(d.hp)}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
