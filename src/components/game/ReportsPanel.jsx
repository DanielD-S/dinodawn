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
                Loot: 🌲{Math.floor(r.loot_wood)} 🦴{Math.floor(r.loot_bones)} 🍖{" "}
                {Math.floor(r.loot_food)} ADN:{Math.floor(r.loot_dna)}
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
