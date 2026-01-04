function int(v) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

export default function ReportsPanel({ reports }) {
  return (
    <>
      <h3>Reportes</h3>

      {reports.length === 0 ? (
        <p style={{ opacity: 0.7 }}>Aún no hay reportes.</p>
      ) : (
        <ul>
          {reports.map((r) => {
            const when = new Date(r.created_at).toLocaleString()

            return (
              <li key={r.id} style={{ marginBottom: 10 }}>
                <b>{r.creature_name}</b> — {String(r.result).toUpperCase()} — {when}
                <br />
                Perdidos: {r.dinos_lost}/{r.dinos_sent}
                <br />
                Loot: 🌿{int(r.loot_plants)} 🦴{int(r.loot_bones)} 🍖{int(r.loot_meat)} ADN:{int(r.loot_dna)}
                <br />
                <span style={{ opacity: 0.75 }}>{r.summary}</span>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
