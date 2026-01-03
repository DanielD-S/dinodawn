import { useEffect, useState } from "react"
import { signOut } from "../services/authService"
import { bootstrapPlayer, getVillage, getResources } from "../services/playerService"

export default function Game() {
  const [loading, setLoading] = useState(true)
  const [village, setVillage] = useState(null)
  const [resources, setResources] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function init() {
      try {
        await bootstrapPlayer("Mi Aldea")
        const v = await getVillage()
        const r = await getResources()
        setVillage(v)
        setResources(r)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (loading) return <div style={{ padding: 24 }}>Cargando aldea...</div>
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>{village?.name}</h1>

      <h2>Recursos</h2>
      <ul>
        <li>🌲 Madera: {Math.floor(resources.wood)}</li>
        <li>🦴 Huesos: {Math.floor(resources.bones)}</li>
        <li>🍖 Comida: {Math.floor(resources.food)}</li>
      </ul>

      <button onClick={signOut}>Salir</button>
    </div>
  )
}
