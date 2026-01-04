import { useEffect, useMemo, useState } from "react"
import { signOut } from "../services/authService"
import {
  bootstrapPlayer,
  getVillage,
  getResources,
  collectResources,
  upgradeStorage,
  getStorageUpgradeCost,
} from "../services/playerService"
import {
  getDinosaurs,
  trainDinosaur,
  claimTrainedDinosaurs,
} from "../services/dinosaursService"
import {
  getCreatures,
  getMyAttacks,
  startPveAttack,
  resolvePveAttack,
  getReports,
} from "../services/pveService"

const TRAINING_OPTIONS = [
  { kind: "theropod", label: "🦖 Terópodo", role: "Ataque" },
  { kind: "herbivore", label: "🦕 Herbívoro", role: "Defensa" },
  { kind: "flyer", label: "🦅 Volador", role: "Exploración" },
  { kind: "aquatic", label: "🐊 Acuático", role: "Zonas especiales" },
]

export default function Game() {
  const [loading, setLoading] = useState(true)

  // Busy granular (evita bloquear toda la UI por una acción)
  const [busy, setBusy] = useState({
    hardRefresh: false,
    collect: false,
    upgradeStorage: false,
    trainKind: null, // string | null
    claim: false,
    startAttackId: null, // id | null
    resolveAttackId: null, // id | null
  })

  const [error, setError] = useState("")

  const [village, setVillage] = useState(null)
  const [resources, setResources] = useState(null)
  const [storageCost, setStorageCost] = useState(null)

  const [dinosaurs, setDinosaurs] = useState([])

  // PvE
  const [creatures, setCreatures] = useState([])
  const [attacks, setAttacks] = useState([])
  const [reports, setReports] = useState([])
  const [selectedDinos, setSelectedDinos] = useState([])

  // Timer UI (countdown PvE)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  function isAnyBusy() {
    return Object.values(busy).some((v) => v !== null && v !== false)
  }

  async function refreshDinosaurs() {
    const d = await getDinosaurs()
    setDinosaurs(d)
  }

  async function refreshVillageResourcesAndCost() {
    const [v, r, c] = await Promise.all([
      getVillage(),
      getResources(),
      getStorageUpgradeCost(),
    ])
    setVillage(v)
    setResources(r)
    setStorageCost(c)
  }

  async function refreshPve() {
    const [c, a, rep] = await Promise.all([
      getCreatures(),
      getMyAttacks(),
      getReports(),
    ])
    setCreatures(c)
    setAttacks(a)
    setReports(rep)
  }

  // Limpia selección si dinos dejan de estar idle
  useEffect(() => {
    const idleIds = new Set(dinosaurs.filter((d) => d.status === "idle").map((d) => d.id))
    setSelectedDinos((prev) => prev.filter((id) => idleIds.has(id)))
  }, [dinosaurs])

  useEffect(() => {
    let alive = true

    async function init() {
      setLoading(true)
      setError("")
      try {
        await bootstrapPlayer("Mi Aldea")

        const [v, r, c, d, pve] = await Promise.all([
          getVillage(),
          getResources(),
          getStorageUpgradeCost(),
          getDinosaurs(),
          (async () => {
            const [cc, aa, rr] = await Promise.all([getCreatures(), getMyAttacks(), getReports()])
            return { cc, aa, rr }
          })(),
        ])

        if (!alive) return
        setVillage(v)
        setResources(r)
        setStorageCost(c)
        setDinosaurs(d)
        setCreatures(pve.cc)
        setAttacks(pve.aa)
        setReports(pve.rr)
      } catch (e) {
        if (!alive) return
        setError(e?.message ?? "Error desconocido")
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    init()
    return () => {
      alive = false
    }
  }, [])

  const canUpgradeStorage = useMemo(() => {
    if (!resources || !storageCost) return false
    return (
      resources.wood >= storageCost.wood_cost &&
      resources.bones >= storageCost.bones_cost &&
      resources.food >= storageCost.food_cost
    )
  }, [resources, storageCost])

  const trainingCount = useMemo(
    () => dinosaurs.filter((d) => d.status === "training").length,
    [dinosaurs]
  )

  async function handleCollect() {
    setBusy((b) => ({ ...b, collect: true }))
    setError("")
    try {
      const updated = await collectResources()
      setResources(updated)
      // el costo depende del nivel, no hace falta refrescar siempre, pero no molesta mantenerlo al día
      const c = await getStorageUpgradeCost()
      setStorageCost(c)
    } catch (e) {
      setError(e?.message ?? "Error al recolectar")
    } finally {
      setBusy((b) => ({ ...b, collect: false }))
    }
  }

  async function handleUpgradeStorage() {
    setBusy((b) => ({ ...b, upgradeStorage: true }))
    setError("")
    try {
      const updated = await upgradeStorage() // RPC upgrade_storage_scaled()
      setResources(updated)
      const c = await getStorageUpgradeCost()
      setStorageCost(c)
    } catch (e) {
      setError(e?.message ?? "Error al mejorar almacén")
    } finally {
      setBusy((b) => ({ ...b, upgradeStorage: false }))
    }
  }

  async function handleTrain(kind) {
    setBusy((b) => ({ ...b, trainKind: kind }))
    setError("")
    try {
      const result = await trainDinosaur(kind) // { resources, dinosaur } o similar
      if (result?.resources) setResources(result.resources)
      await refreshDinosaurs()
    } catch (e) {
      setError(e?.message ?? "Error al entrenar")
    } finally {
      setBusy((b) => ({ ...b, trainKind: null }))
    }
  }

  async function handleClaim() {
    setBusy((b) => ({ ...b, claim: true }))
    setError("")
    try {
      await claimTrainedDinosaurs()
      await refreshDinosaurs()
    } catch (e) {
      setError(e?.message ?? "Error al reclamar entrenados")
    } finally {
      setBusy((b) => ({ ...b, claim: false }))
    }
  }

  async function handleHardRefresh() {
    setBusy((b) => ({ ...b, hardRefresh: true }))
    setError("")
    try {
      await Promise.all([refreshVillageResourcesAndCost(), refreshDinosaurs(), refreshPve()])
    } catch (e) {
      setError(e?.message ?? "Error al refrescar")
    } finally {
      setBusy((b) => ({ ...b, hardRefresh: false }))
    }
  }

  async function handleStartAttack(creatureId) {
    setBusy((b) => ({ ...b, startAttackId: creatureId }))
    setError("")
    try {
      await startPveAttack(creatureId, selectedDinos)
      setSelectedDinos([])
      setAttacks(await getMyAttacks())
    } catch (e) {
      setError(e?.message ?? "Error al atacar")
    } finally {
      setBusy((b) => ({ ...b, startAttackId: null }))
    }
  }

  async function handleResolveAttack(attackId) {
    setBusy((b) => ({ ...b, resolveAttackId: attackId }))
    setError("")
    try {
      await resolvePveAttack(attackId)
      await refreshDinosaurs()
      // Evita recolectar aquí si collectResources tiene side-effects; mejor leer recursos reales:
      const [r, a, rep, c] = await Promise.all([
        getResources(),
        getMyAttacks(),
        getReports(),
        getStorageUpgradeCost(),
      ])
      setResources(r)
      setAttacks(a)
      setReports(rep)
      setStorageCost(c)
    } catch (e) {
      setError(e?.message ?? "Error al resolver")
    } finally {
      setBusy((b) => ({ ...b, resolveAttackId: null }))
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Cargando aldea...</div>

  if (!resources) {
    return (
      <div style={{ padding: 24 }}>
        <p>No hay recursos cargados.</p>
        <button onClick={handleHardRefresh} disabled={busy.hardRefresh}>
          {busy.hardRefresh ? "Refrescando..." : "Reintentar"}
        </button>
        <div style={{ marginTop: 16 }}>
          <button onClick={signOut}>Salir</button>
        </div>
      </div>
    )
  }

  const anyBusy = isAnyBusy()

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>{village?.name ?? "Aldea"}</h1>
          <p style={{ marginTop: 6, opacity: 0.7 }}>
            MVP v0.1 — loop: producir → recolectar → mejorar → entrenar → PvE
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={handleHardRefresh} disabled={busy.hardRefresh}>
            {busy.hardRefresh ? "Refrescando..." : "Refrescar"}
          </button>
          <button onClick={signOut}>Salir</button>
        </div>
      </div>

      {/* Error no bloqueante */}
      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            background: "#ffe9e9",
          }}
        >
          <b style={{ color: "crimson" }}>Error:</b> {error}{" "}
          <button
            style={{ marginLeft: 10 }}
            onClick={() => setError("")}
            disabled={anyBusy}
          >
            Cerrar
          </button>
        </div>
      )}

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
        <button onClick={handleCollect} disabled={busy.collect}>
          {busy.collect ? "Recolectando..." : "Actualizar / Recolectar"}
        </button>

        <button onClick={handleUpgradeStorage} disabled={busy.upgradeStorage || !canUpgradeStorage}>
          {busy.upgradeStorage
            ? "Mejorando..."
            : `Mejorar almacén (→ 📦 ${storageCost ? Math.floor(storageCost.next_cap) : "..."})`}
        </button>
      </div>

      {storageCost ? (
        <p style={{ marginTop: 10, opacity: 0.85 }}>
          Almacén lvl <b>{storageCost.current_level}</b> → <b>{storageCost.next_level}</b> | Próxima cap: 📦{" "}
          <b>{Math.floor(storageCost.next_cap)}</b>
          <br />
          Costo mejora: 🌲 {Math.floor(storageCost.wood_cost)} / 🦴 {Math.floor(storageCost.bones_cost)} / 🍖{" "}
          {Math.floor(storageCost.food_cost)}
        </p>
      ) : (
        <p style={{ marginTop: 10, opacity: 0.85 }}>Cargando costo del almacén...</p>
      )}

      {storageCost && !canUpgradeStorage && (
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
          <button
            key={opt.kind}
            disabled={busy.trainKind !== null}
            onClick={() => handleTrain(opt.kind)}
          >
            {busy.trainKind === opt.kind ? "Entrenando..." : `Entrenar ${opt.label} (${opt.role})`}
          </button>
        ))}

        <button disabled={busy.claim} onClick={handleClaim}>
          {busy.claim ? "Reclamando..." : "Reclamar entrenados"}
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
                  {d.status === "training" && ends ? ` (termina: ${ends.toLocaleTimeString()})` : ""}
                  {" | "}ATK {Math.floor(d.attack)} / DEF {Math.floor(d.defense)} / HP {Math.floor(d.hp)}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <hr style={{ margin: "18px 0" }} />

      {/* PVE */}
      <h2>PvE</h2>
      <p style={{ opacity: 0.75 }}>
        Selecciona dinosaurios <b>idle</b> y envíalos contra una criatura. (viaje ~25s)
      </p>

      <div style={{ marginTop: 8 }}>
        <p>
          <b>Selecciona dinosaurios (idle)</b>
        </p>

        {dinosaurs.filter((d) => d.status === "idle").length === 0 ? (
          <p style={{ opacity: 0.7 }}>No tienes dinos idle disponibles.</p>
        ) : (
          dinosaurs
            .filter((d) => d.status === "idle")
            .map((d) => (
              <label key={d.id} style={{ display: "block" }}>
                <input
                  type="checkbox"
                  checked={selectedDinos.includes(d.id)}
                  onChange={(e) => {
                    setSelectedDinos((prev) =>
                      e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id)
                    )
                  }}
                  disabled={busy.startAttackId !== null} // evita cambiar selección mientras dispara ataque
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
                <b>{c.name}</b> (lvl {c.level}, {c.biome}) — ATK {c.attack} / DEF {c.defense} / HP{" "}
                {c.hp}
                <br />
                Loot: 🌲{c.loot_wood} 🦴{c.loot_bones} 🍖{c.loot_food} | ADN{" "}
                {Math.round(c.dna_chance * 100)}%
                <br />
                <button
                  disabled={busy.startAttackId !== null || selectedDinos.length === 0}
                  onClick={() => handleStartAttack(c.id)}
                >
                  {busy.startAttackId === c.id ? "Atacando..." : "Atacar"}
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
              const resolvingThis = busy.resolveAttackId === a.id

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
                    onClick={() => handleResolveAttack(a.id)}
                  >
                    {resolvingThis ? "Resolviendo..." : "Resolver"}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
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
      </div>
    </div>
  )
}
