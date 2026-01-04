import { useEffect, useMemo, useRef, useState } from "react"
import {
  bootstrapPlayer,
  getVillage,
  getResources,
  collectResources,
  upgradeStorage,
  getStorageUpgradeCost,
} from "../services/playerService"

import { getDinosaurs, trainDinosaur, claimTrainedDinosaurs } from "../services/dinosaursService"
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
import GameMenuTop from "../components/game/GameMenuTop"

import { getMyBuildingsView, upgradeBuilding } from "../services/buildingsService"
import BuildingsPanel from "../components/game/BuildingsPanel"

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

  const [buildings, setBuildings] = useState([])
  const [view, setView] = useState("village") // village | buildings | dinosaurs | pve | reports

  const [lastSyncAt, setLastSyncAt] = useState(null)
  const syncingRef = useRef(false)

  async function refreshDinosaurs() {
    setDinosaurs(await getDinosaurs())
  }

  async function refreshBuildings() {
    setBuildings(await getMyBuildingsView())
  }

  async function refreshPve() {
    const [cc, aa, rr] = await Promise.all([getCreatures(), getMyAttacks(), getReports()])
    setCreatures(cc)
    setAttacks(aa)
    setReports(rr)
  }

  async function refreshVillageResourcesAndCost() {
    const [v, r, c] = await Promise.all([getVillage(), getResources(), getStorageUpgradeCost()])
    setVillage(v)
    setResources(r)
    setStorageCost(c)
  }

  // Limpia selección si dinos dejan de estar idle
  useEffect(() => {
    const idleIds = new Set(dinosaurs.filter((d) => d.status === "idle").map((d) => d.id))
    setSelectedDinos((prev) => prev.filter((id) => idleIds.has(id)))
  }, [dinosaurs])

  // ✅ Rates/h desde edificios (FUENTE DE VERDAD)
  const ratesPerHour = useMemo(() => {
    if (!buildings || buildings.length === 0) return { wood: 0, bones: 0, food: 0 }
    return buildings.reduce(
      (acc, b) => ({
        wood: acc.wood + Number(b.prod_wood_per_hour || 0),
        bones: acc.bones + Number(b.prod_bones_per_hour || 0),
        food: acc.food + Number(b.prod_food_per_hour || 0),
      }),
      { wood: 0, bones: 0, food: 0 }
    )
  }, [buildings])

  // INIT
  useEffect(() => {
    let alive = true
    async function init() {
      setLoading(true)
      setError("")
      try {
        await bootstrapPlayer("Mi Aldea")

        const [v, r, c, d, b, cc, aa, rr] = await Promise.all([
          getVillage(),
          getResources(),
          getStorageUpgradeCost(),
          getDinosaurs(),
          getMyBuildingsView(),
          getCreatures(),
          getMyAttacks(),
          getReports(),
        ])

        if (!alive) return
        setVillage(v)
        setResources(r)
        setStorageCost(c)
        setDinosaurs(d)
        setBuildings(b)
        setCreatures(cc)
        setAttacks(aa)
        setReports(rr)
        setLastSyncAt(Date.now())
      } catch (e) {
        if (!alive) return
        setError(e?.message ?? "Error desconocido")
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }
    init()
    return () => { alive = false }
  }, [])

  // ✅ Sync centralizado (auto + manual)
  async function syncNow() {
    if (syncingRef.current) return
    syncingRef.current = true
    try {
      const updated = await collectResources()
      setResources(updated)
      setLastSyncAt(Date.now())
      setStorageCost(await getStorageUpgradeCost())
    } finally {
      syncingRef.current = false
    }
  }

  const canUpgradeStorage = useMemo(() => {
    if (!resources || !storageCost) return false
    return (
      Number(resources.wood) >= Number(storageCost.wood_cost) &&
      Number(resources.bones) >= Number(storageCost.bones_cost) &&
      Number(resources.food) >= Number(storageCost.food_cost)
    )
  }, [resources, storageCost])

  const trainingCount = useMemo(
    () => dinosaurs.filter((d) => d.status === "training").length,
    [dinosaurs]
  )

  const badges = useMemo(() => {
    const activeAttacks = attacks.filter((a) => a.status !== "resolved").length
    return {
      pve: activeAttacks,
      reports: reports.length,
    }
  }, [attacks, reports])

  // ✅ Métricas UI de cap/tiempo a llenar (con rates reales)
  const storageUi = useMemo(() => {
    if (!resources) return null

    const cap = Math.max(1, Number(resources.storage_cap ?? 1))
    const w = Number(resources.wood ?? 0)
    const b = Number(resources.bones ?? 0)
    const f = Number(resources.food ?? 0)

    const wPct = Math.min(100, Math.max(0, (w / cap) * 100))
    const bPct = Math.min(100, Math.max(0, (b / cap) * 100))
    const fPct = Math.min(100, Math.max(0, (f / cap) * 100))
    const maxPct = Math.max(wPct, bPct, fPct)

    function hoursToCap(current, perHour) {
      if (current >= cap) return 0
      if (!perHour || perHour <= 0) return null
      return (cap - current) / perHour
    }

    return {
      cap,
      wPct,
      bPct,
      fPct,
      maxPct,
      hoursToCap: {
        wood: hoursToCap(w, ratesPerHour.wood),
        bones: hoursToCap(b, ratesPerHour.bones),
        food: hoursToCap(f, ratesPerHour.food),
      },
    }
  }, [resources, ratesPerHour])

  // ✅ AUTO-SYNC DINÁMICO (más rápido cuando estás por llenar)
  const autoSyncSeconds = useMemo(() => {
    // si no hay recursos, default
    if (!resources || !storageUi) return 10

    const totalRate =
      Number(ratesPerHour.wood || 0) + Number(ratesPerHour.bones || 0) + Number(ratesPerHour.food || 0)

    // si no produces nada => sync lento
    if (totalRate <= 0) return 30

    const maxPct = Number(storageUi.maxPct || 0)

    // toma el menor tiempo a llenarse entre los que efectivamente producen
    const candidates = [
      storageUi.hoursToCap.wood,
      storageUi.hoursToCap.bones,
      storageUi.hoursToCap.food,
    ]
      .filter((h) => h !== null && h !== undefined)
      .map((h) => Number(h))

    const minHours = candidates.length ? Math.min(...candidates) : null
    const minMinutes = minHours === null ? null : minHours * 60

    // reglas simples (MVP)
    if (maxPct >= 99) return 25 // casi lleno: no necesitas machacar el backend
    if (minMinutes !== null && minMinutes <= 5) return 3
    if (minMinutes !== null && minMinutes <= 15) return 5
    if (minMinutes !== null && minMinutes <= 60) return 10
    return 20
  }, [resources, storageUi, ratesPerHour])

  // ✅ Auto-recolección: cada autoSyncSeconds mientras pestaña visible
  useEffect(() => {
    if (!resources) return

    const tick = async () => {
      if (document.visibilityState !== "visible") return
      if (busy.hardRefresh || busy.upgradeStorage || busy.upgradeBuildingType) return
      try {
        await syncNow()
      } catch {
        // silencioso
      }
    }

    const s = Math.max(3, Number(autoSyncSeconds || 10))
    const id = setInterval(tick, s * 1000)
    return () => clearInterval(id)
  }, [resources, busy.hardRefresh, busy.upgradeStorage, busy.upgradeBuildingType, autoSyncSeconds])

  async function handleCollect() {
    setFlag("collect", true)
    setError("")
    try {
      await syncNow()
    } catch (e) {
      setError(e?.message ?? "Error al sincronizar")
    } finally {
      setFlag("collect", false)
    }
  }

  async function handleUpgradeStorage() {
    setFlag("upgradeStorage", true)
    setError("")
    try {
      const updated = await upgradeStorage()
      setResources(updated)
      setLastSyncAt(Date.now())
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
      if (result?.resources) {
        setResources(result.resources)
        setLastSyncAt(Date.now())
      }
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
        refreshBuildings(),
      ])
      setLastSyncAt(Date.now())
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
      setLastSyncAt(Date.now())
    } catch (e) {
      setError(e?.message ?? "Error al resolver")
    } finally {
      setFlag("resolveAttackId", null)
    }
  }

  async function handleUpgradeBuilding(buildingType) {
    setFlag("upgradeBuildingType", buildingType)
    setError("")
    try {
      const result = await upgradeBuilding(buildingType)

      if (result?.resources) setResources(result.resources)
      else if (result?.wood !== undefined) setResources(result)

      await refreshBuildings() // ✅ actualiza ratesPerHour automáticamente
      setLastSyncAt(Date.now())
    } catch (e) {
      setError(e?.message ?? "Error al mejorar edificio")
    } finally {
      setFlag("upgradeBuildingType", null)
    }
  }

  const nextAutoInSeconds = useMemo(() => {
    const s = Math.max(3, Number(autoSyncSeconds || 10))
    return Math.max(0, s - (Math.floor(now / 1000) % s))
  }, [now, autoSyncSeconds])

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

  const menuBadges = {
    ...badges,
    buildings: buildings?.length ? buildings.length : 0,
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <GameHeader
        villageName={village?.name}
        onRefresh={handleHardRefresh}
        refreshing={busy.hardRefresh}
      />

      <ErrorBanner error={error} onClose={() => setError("")} disabled={anyBusy} />

      <GameMenuTop view={view} setView={setView} disabled={false} badges={menuBadges} />

      {view === "village" && (
        <ResourcesPanel
          resources={resources}
          storageCost={storageCost}
          canUpgradeStorage={canUpgradeStorage}
          onCollect={handleCollect}
          onUpgradeStorage={handleUpgradeStorage}
          busyCollect={busy.collect}
          busyUpgrade={busy.upgradeStorage}
          ratesPerHour={ratesPerHour}
          storageUi={storageUi}
          nextAutoInSeconds={nextAutoInSeconds}
          lastSyncAt={lastSyncAt}
          now={now}
          syncing={busy.collect}
          autoSyncSeconds={autoSyncSeconds} // 👈 NUEVO (para mostrarlo)
        />
      )}

      {view === "buildings" && (
        <BuildingsPanel
          buildings={buildings}
          onUpgrade={handleUpgradeBuilding}
          busyUpgradeType={busy.upgradeBuildingType}
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
