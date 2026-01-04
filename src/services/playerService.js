import { supabase } from "../lib/supabaseClient"

export async function bootstrapPlayer(villageName = "Mi Aldea") {
  const { error } = await supabase.rpc("bootstrap_player", {
    village_name: villageName,
  })
  if (error) throw error
}

export async function getVillage() {
  const { data, error } = await supabase
    .from("villages")
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function getResources() {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .single()
  if (error) throw error
  return data
}
export async function collectResources() {
  const { data, error } = await supabase.rpc("collect_resources")
  if (error) throw error
  return data
}
export async function upgradeStorage() {
  const { data, error } = await supabase.rpc("upgrade_storage_scaled")
  if (error) throw error
  return data
}

export async function getStorageUpgradeCost() {
  const { data, error } = await supabase.rpc("get_storage_upgrade_cost")
  if (error) throw error
  return data
}
export async function getProductionRates() {
  const { data, error } = await supabase.rpc("get_production_rates")
  if (error) throw error
  return data
}

export async function upgradeBuilding(buildingType) {
  const { data, error } = await supabase.rpc("upgrade_building", {
    p_building_type: buildingType,
  })
  if (error) throw error
  return data // { resources, building, paid, next_cost, max_level }
}

export async function ensureBaseBuildings() {
  const { data, error } = await supabase.rpc("ensure_base_buildings")
  if (error) throw error
  return data
}
