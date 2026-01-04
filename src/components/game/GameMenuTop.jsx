export default function GameMenuTop({ view, setView, disabled, badges = {} }) {
  const items = [
    { id: "village", label: "🏡 Aldea" },
    { id: "buildings", label: "🏗️ Edificios" },
    { id: "dinosaurs", label: "🦖 Dinosaurios" },
    { id: "pve", label: "⚔️ PvE" },
    { id: "reports", label: "📜 Reportes" },
  ]

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "10px 0",
        borderBottom: "1px solid #e5e5e5",
        marginBottom: 14,
      }}
    >
      {items.map((it) => {
        const active = view === it.id
        const badge = badges[it.id]

        return (
          <button
            key={it.id}
            onClick={() => {
              if (disabled) return
              setView(it.id)
            }}
            disabled={disabled}
            style={{
              padding: "8px 12px",
              borderRadius: 12,
              border: active ? "1px solid #111" : "1px solid #ddd",
              background: active ? "#111" : "#fff",
              color: active ? "#fff" : "#111",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.7 : 1,
              display: "flex",
              gap: 8,
              alignItems: "center",
              fontWeight: active ? 700 : 600,
            }}
          >
            <span>{it.label}</span>

            {typeof badge === "number" && badge > 0 && (
              <span
                style={{
                  minWidth: 22,
                  height: 22,
                  padding: "0 6px",
                  borderRadius: 999,
                  background: active ? "#fff" : "#111",
                  color: active ? "#111" : "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
