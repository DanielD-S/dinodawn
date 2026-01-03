import { useEffect, useState } from "react"
import { signOut } from "../services/authService"
import {
  bootstrapPlayer,
  getVillage,
  getResources,
  collectResources,
  upgradeStorage,
} from "../services/playerService"

const STORAGE_UPGRADE_COST = {
  wood: 200,
  bones: 80,
  food: 120,
}
const STORAGE_CAP_INCREASE = 250

export default function Game() {
  const [loading, setLoading] = useState(true)
  const [village, setVillage] = useState(null)
  const [resources, setResources] = useState(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

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

  async function handleCollect() {
    setBusy(true)
    setError("")
    try {
      const updated = await collectResources()
      setResources(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUpgradeStorage() {
    setBusy(true)
    setError("")
    try {
      const updated = await upgradeStorage()
      setResources(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Cargando aldea...</div>
  if (!resources) return <div style={{ padding: 24 }}>Sin datos...</div>

  const canUpgrade =
    resources.wood >= STORAGE_UPGRADE_COST.wood &&
    resources.bones >= STORAGE_UPGRADE_COST.bones &&
    resources.food >= STORAGE_UPGRADE_COST.food

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>{village?.name}</h1>

      <h2>Recursos</h2>
      <ul>
        <li>🌲 Madera: {Math.floor(resources.wood)}</li>
        <li>🦴 Huesos: {Math.floor(resources.bones)}</li>
        <li>🍖 Comida: {Math.floor(resources.food)}</li>
        <li>📦 Cap: {Math.floor(resources.storage_cap)}</li>
      </ul>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={handleCollect} disabled={busy}>
          {busy ? "Procesando..." : "Actualizar / Recolectar"}
        </button>

        <button onClick={handleUpgradeStorage} disabled={busy || !canUpgrade}>
          Mejorar almacén (+{STORAGE_CAP_INCREASE} cap)
        </button>
      </div>

      <p style={{ marginTop: 12 }}>
        Costo almacén: 🌲 {STORAGE_UPGRADE_COST.wood} / 🦴{" "}
        {STORAGE_UPGRADE_COST.bones} / 🍖 {STORAGE_UPGRADE_COST.food}
      </p>

      {!canUpgrade && (
        <p style={{ opacity: 0.7 }}>
          Te faltan recursos para mejorar el almacén.
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <button onClick={signOut}>Salir</button>
      </div>
    </div>
  )
}
