import { supabase } from "../lib/supabaseClient"

// ✅ Vista “rica” para UI (producción + costos + max)
export async function getMyBuildingsView() {
  const { data, error } = await supabase.rpc("get_my_buildings_view")
  if (error) throw error
  return data
}

// (si ya la tienes, déjala igual)
export async function upgradeBuilding(buildingType) {
  const { data, error } = await supabase.rpc("upgrade_building", {
    p_building_type: buildingType,
  })
  if (error) throw error
  return data
}