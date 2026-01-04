import { useEffect, useMemo, useState } from "react"
import { signOut } from "../services/authService"
import {
  bootstrapPlayer,
  getVillage,
  getResources,
  collectResources,
  upgradeStorage,
} from "../services/playerService"
import {
  getDinosaurs,
  trainDinosaur,
  claimTrainedDinosaurs,
} from "../services/dinosaursService"

const STORAGE_UPGRADE_COST = {
  wood: 200,
  bones: 80,
  food: 120,
}
const STORAGE_CAP_INCREASE = 250

const TRAINING_OPTIONS = [
  { kind: "theropod", label: "🦖 Terópodo", role: "Ataque" },
  { kind: "herbivore", label: "🦕 Herbívoro", role: "Defensa" },
  { kind: "flyer", label: "🦅 Volador", role: "Exploración" },
  { kind: "aquatic", label: "🐊 Acuático", role: "Zonas especiales" },
]

export default function Game() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const [village, setVillage] = useState(null)
  const [resources, setResources] = useState(null)
  const [dinosaurs, setDinosaurs] = useState([])

  async function refreshDinosaurs() {
    const d = await getDinosaurs()
    setDinosaurs(d)
  }

  async function refreshVillageAndResources() {
    const v = await getVillage()
    const r = await getResources()
    setVillage(v)
    setResources(r)
  }

  useEffect(() => {
    async function init() {
      setLoading(true)
      setError("")
      try {
        await bootstrapPlayer("Mi Aldea")
        await refreshVillageAndResources()
        await refreshDinosaurs()
      } catch (e) {
        setError(e?.message ?? "Error desconocido")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const canUpgradeStorage = useMemo(() => {
    if (!resources) return false
    return (
      resources.wood >= STORAGE_UPGRADE_COST.wood &&
      resources.bones >= STORAGE_UPGRADE_COST.bones &&
      resources.food >= STORAGE_UPGRADE_COST.food
    )
  }, [resources])

  const trainingCount = useMemo(
    () => dinosaurs.filter((d) => d.status === "training").length,
    [dinosaurs]
  )

  async function handleCollect() {
    setBusy(true)
    setError("")
    try {
      const updated = await collectResources()
      setResources(updated)
    } catch (e) {
      setError(e?.message ?? "Error al recolectar")
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
      setError(e?.message ?? "Error al mejorar almacén")
    } finally {
      setBusy(false)
    }
  }

  async function handleTrain(kind) {
    setBusy(true)
    setError("")
    try {
      const result = await trainDinosaur(kind) // { resources, dinosaur }
      if (result?.resources) setResources(result.resources)
      await refreshDinosaurs()
    } catch (e) {
      setError(e?.message ?? "Error al entrenar")
    } finally {
      setBusy(false)
    }
  }

  async function handleClaim() {
    setBusy(true)
    setError("")
    try {
      await claimTrainedDinosaurs()
      await refreshDinosaurs()
    } catch (e) {
      setError(e?.message ?? "Error al reclamar entrenados")
    } finally {
      setBusy(false)
    }
  }

  async function handleHardRefresh() {
    setBusy(true)
    setError("")
    try {
      await refreshVillageAndResources()
      await refreshDinosaurs()
    } catch (e) {
      setError(e?.message ?? "Error al refrescar")
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Cargando aldea...</div>

  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h2 style={{ color: "crimson" }}>Error</h2>
        <p>{error}</p>
        <button onClick={handleHardRefresh} disabled={busy}>
          Reintentar
        </button>
        <div style={{ marginTop: 16 }}>
          <button onClick={signOut}>Salir</button>
        </div>
      </div>
    )
  }

  if (!resources) {
    return (
      <div style={{ padding: 24 }}>
        <p>No hay recursos cargados.</p>
        <button onClick={handleHardRefresh} disabled={busy}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>{village?.name ?? "Aldea"}</h1>
          <p style={{ marginTop: 6, opacity: 0.7 }}>
            MVP v0.1 — loop: producir → recolectar → mejorar → entrenar
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={handleHardRefresh} disabled={busy}>
            Refrescar
          </button>
          <button onClick={signOut}>Salir</button>
        </div>
      </div>

      <hr style={{ margin: "18px 0" }} />

      {/* RECURSOS */}
      <h2>Recursos</h2>
      <ul>
        <li>🌲 Madera: {Math.floor(resources.wood)}</li>
        <li>🦴 Huesos: {Math.floor(resources.bones)}</li>
        <li>🍖 Comida: {Math.floor(resources.food)}</li>
        <li>📦 Cap: {Math.floor(resources.storage_cap)}</li>
      </ul>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={handleCollect} disabled={busy}>
          {busy ? "Procesando..." : "Actualizar / Recolectar"}
        </button>

        <button onClick={handleUpgradeStorage} disabled={busy || !canUpgradeStorage}>
          Mejorar almacén (+{STORAGE_CAP_INCREASE} cap)
        </button>
      </div>

      <p style={{ marginTop: 10, opacity: 0.85 }}>
        Costo almacén: 🌲 {STORAGE_UPGRADE_COST.wood} / 🦴 {STORAGE_UPGRADE_COST.bones} / 🍖{" "}
        {STORAGE_UPGRADE_COST.food}
      </p>

      {!canUpgradeStorage && (
        <p style={{ marginTop: 4, opacity: 0.65 }}>
          Te faltan recursos para mejorar el almacén.
        </p>
      )}

      <hr style={{ margin: "18px 0" }} />

      {/* DINOSAURIOS */}
      <h2>Dinosaurios</h2>
      <p style={{ marginTop: 6, opacity: 0.75 }}>
        Entrenando ahora: <b>{trainingCount}</b>
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {TRAINING_OPTIONS.map((opt) => (
          <button key={opt.kind} disabled={busy} onClick={() => handleTrain(opt.kind)}>
            Entrenar {opt.label} ({opt.role})
          </button>
        ))}

        <button disabled={busy} onClick={handleClaim}>
          Reclamar entrenados
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
                  {" | "}
                  ATK {Math.floor(d.attack)} / DEF {Math.floor(d.defense)} / HP{" "}
                  {Math.floor(d.hp)}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
