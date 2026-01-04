import { signOut } from "../../services/authService"

export default function GameHeader({ villageName, onRefresh, refreshing }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div>
        <h1 style={{ margin: 0 }}>{villageName ?? "Aldea"}</h1>
        <p style={{ marginTop: 6, opacity: 0.7 }}>
          MVP v0.1 — loop: producir → recolectar → mejorar → entrenar → PvE
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refrescando..." : "Refrescar"}
        </button>
        <button onClick={signOut}>Salir</button>
      </div>
    </div>
  )
}
