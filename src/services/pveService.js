import { supabase } from "../lib/supabaseClient"

export async function getCreatures() {
  const { data, error } = await supabase
    .from("pve_creatures")
    .select("*")
    .order("level", { ascending: true })
  if (error) throw error
  return data
}

export async function getMyAttacks() {
  const { data, error } = await supabase
    .from("pve_attacks")
    .select("*, pve_creatures(name, level, biome)")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function startPveAttack(creatureId, dinosaurIds) {
  const { data, error } = await supabase.rpc("start_pve_attack", {
    creature_id: creatureId,
    dinosaur_ids: dinosaurIds,
  })
  if (error) throw error
  return data
}

export async function resolvePveAttack(attackId) {
  const { data, error } = await supabase.rpc("resolve_pve_attack", {
    attack_id: attackId,
  })
  if (error) throw error
  return data
}

export async function getReports() {
  const { data, error } = await supabase
    .from("combat_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}
