import { signOut } from "../services/authService"

export default function Game() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Dino Dawn</h1>
      <p>Juego en progreso…</p>
      <button onClick={signOut}>Salir</button>
    </div>
  )
}
