import { useEffect, useMemo, useState } from "react"
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

import { useBusy } from "../hooks/useBusy"
import { useGameClock } from "../hooks/useGameClock"

import GameHeader from "../components/game/GameHeader"
import ErrorBanner from "../components/game/ErrorBanner"
import ResourcesPanel from "../components/game/ResourcesPanel"
import DinosaursPanel from "../components/game/DinosaursPanel"
import PvePanel from "../components/game/PvePanel"
import ReportsPanel from "../components/game/ReportsPanel"
import GameMenuTop from "../components/game/GameMenu"

export default function Game() {
  const [loading, setLoading] = useState(true)
  const { busy, setFlag, anyBusy } = useBusy()
  const now = useGameClock(1000)

  const [error, setError] = useState("")
  const [village, setVillage] = useState(null)
  const [resources, setResources] = useState(null)
  const [storageCost, setStorageCost] = useState(null)

  const [dinosaurs, setDinosaurs] = useState([])
  const [creatures, setCreatures] = useState([])
  const [attacks, setAttacks] = useState([])
  const [reports, setReports] = useState([])
  const [selectedDinos, setSelectedDinos] = useState([])

  // ✅ Vista actual (menú)
  const [view, setView] = useState("village") // village | dinosaurs | pve | reports

  async function refreshDinosaurs() {
    setDinosaurs(await getDinosaurs())
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
    const idleIds = new Set(
      dinosaurs.filter((d) => d.status === "idle").map((d) => d.id)
    )
    setSelectedDinos((prev) => prev.filter((id) => idleIds.has(id)))
  }, [dinosaurs])

  useEffect(() => {
    let alive = true

    async function init() {
      setLoading(true)
      setError("")
      try {
        await bootstrapPlayer("Mi Aldea")

        const [v, r, c, d, cc, aa, rr] = await Promise.all([
          getVillage(),
          getResources(),
          getStorageUpgradeCost(),
          getDinosaurs(),
          getCreatures(),
          getMyAttacks(),
          getReports(),
        ])

        if (!alive) return
        setVillage(v)
        setResources(r)
        setStorageCost(c)
        setDinosaurs(d)
        setCreatures(cc)
        setAttacks(aa)
        setReports(rr)
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

  // ✅ Badges tipo juego
  const badges = useMemo(() => {
    const activeAttacks = attacks.filter((a) => a.status !== "resolved").length
    return {
      pve: activeAttacks,
      reports: reports.length,
    }
  }, [attacks, reports])

  async function handleCollect() {
    setFlag("collect", true)
    setError("")
    try {
      setResources(await collectResources())
      setStorageCost(await getStorageUpgradeCost())
    } catch (e) {
      setError(e?.message ?? "Error al recolectar")
    } finally {
      setFlag("collect", false)
    }
  }

  async function handleUpgradeStorage() {
    setFlag("upgradeStorage", true)
    setError("")
    try {
      setResources(await upgradeStorage())
      setStorageCost(await getStorageUpgradeCost())
    } catch (e) {
      setError(e?.message ?? "Error al mejorar almacén")
    } finally {
      setFlag("upgradeStorage", false)
    }
  }

  async function handleTrain(kind) {
    setFlag("trainKind", kind)
    setError("")
    try {
      const result = await trainDinosaur(kind)
      if (result?.resources) setResources(result.resources)
      await refreshDinosaurs()
    } catch (e) {
      setError(e?.message ?? "Error al entrenar")
    } finally {
      setFlag("trainKind", null)
    }
  }

  async function handleClaim() {
    setFlag("claim", true)
    setError("")
    try {
      await claimTrainedDinosaurs()
      await refreshDinosaurs()
    } catch (e) {
      setError(e?.message ?? "Error al reclamar entrenados")
    } finally {
      setFlag("claim", false)
    }
  }

  async function handleHardRefresh() {
    setFlag("hardRefresh", true)
    setError("")
    try {
      await Promise.all([
        refreshVillageResourcesAndCost(),
        refreshDinosaurs(),
        refreshPve(),
      ])
    } catch (e) {
      setError(e?.message ?? "Error al refrescar")
    } finally {
      setFlag("hardRefresh", false)
    }
  }

  async function handleStartAttack(creatureId) {
    setFlag("startAttackId", creatureId)
    setError("")
    try {
      await startPveAttack(creatureId, selectedDinos)
      setSelectedDinos([])
      setAttacks(await getMyAttacks())
      // ✅ opcional: llevar al jugador directo a PvE
      setView("pve")
    } catch (e) {
      setError(e?.message ?? "Error al atacar")
    } finally {
      setFlag("startAttackId", null)
    }
  }

  async function handleResolveAttack(attackId) {
    setFlag("resolveAttackId", attackId)
    setError("")
    try {
      await resolvePveAttack(attackId)
      await refreshDinosaurs()

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
      setFlag("resolveAttackId", null)
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
      </div>
    )
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <GameHeader
        villageName={village?.name}
        onRefresh={handleHardRefresh}
        refreshing={busy.hardRefresh}
      />

      <ErrorBanner
        error={error}
        onClose={() => setError("")}
        disabled={anyBusy}
      />

      {/* ✅ Menú arriba */}
      <GameMenuTop
        view={view}
        setView={setView}
        disabled={false} // cambia a anyBusy si quieres bloquear navegación
        badges={badges}
      />

      {/* ✅ Render por vista */}
      {view === "village" && (
        <ResourcesPanel
          resources={resources}
          storageCost={storageCost}
          canUpgradeStorage={canUpgradeStorage}
          onCollect={handleCollect}
          onUpgradeStorage={handleUpgradeStorage}
          busyCollect={busy.collect}
          busyUpgrade={busy.upgradeStorage}
        />
      )}

      {view === "dinosaurs" && (
        <DinosaursPanel
          dinosaurs={dinosaurs}
          trainingCount={trainingCount}
          onTrain={handleTrain}
          onClaim={handleClaim}
          busyTrainKind={busy.trainKind}
          busyClaim={busy.claim}
        />
      )}

      {view === "pve" && (
        <PvePanel
          dinosaurs={dinosaurs}
          creatures={creatures}
          attacks={attacks}
          selectedDinos={selectedDinos}
          setSelectedDinos={setSelectedDinos}
          onStartAttack={handleStartAttack}
          onResolveAttack={handleResolveAttack}
          busyStartAttackId={busy.startAttackId}
          busyResolveAttackId={busy.resolveAttackId}
          now={now}
        />
      )}

      {view === "reports" && <ReportsPanel reports={reports} />}
    </div>
  )
}
