import { supabase } from "../lib/supabaseClient"

export async function getCreatures() {
  const { data, error } = await supabase
    .from("pve_creatures")
    .select("*")
    .order("level", { ascending: true })

  if (error) {
    console.error("getCreatures error:", error)
    throw error
  }
  return data ?? []
}

export async function getMyAttacks() {
  const { data, error } = await supabase
    .from("pve_attacks")
    .select("*, pve_creatures(name, level, biome)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getMyAttacks error:", error)
    throw error
  }
  return data ?? []
}

export async function startPveAttack(creatureId, dinosaurIds) {
  if (!creatureId) throw new Error("creatureId inválido")
  if (!Array.isArray(dinosaurIds) || dinosaurIds.length === 0) {
    throw new Error("Debes seleccionar al menos 1 dinosaurio")
  }

  const { data, error } = await supabase.rpc("start_pve_attack", {
    creature_id: creatureId,
    dinosaur_ids: dinosaurIds,
  })

  if (error) {
    console.error("start_pve_attack error:", error)
    throw error
  }
  return data
}

export async function resolvePveAttack(attackId) {
  if (!attackId) throw new Error("attackId inválido")

  const { data, error } = await supabase.rpc("resolve_pve_attack", {
    attack_id: attackId,
  })

  if (error) {
    console.error("resolve_pve_attack error:", error)
    throw error
  }
  return data
}

export async function getReports() {
  const { data, error } = await supabase
    .from("combat_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("getReports error:", error)
    throw error
  }
  return data ?? []
}
