import { supabase } from "../lib/supabaseClient"

function assertBuildingType(buildingType) {
  if (!buildingType || typeof buildingType !== "string") {
    throw new Error("buildingType inválido")
  }
}

export async function getMyBuildingsView() {
  const { data, error } = await supabase.rpc("get_my_buildings_view")
  if (error) {
    console.error("get_my_buildings_view error:", error)
    throw error
  }
  return data ?? []
}

export async function upgradeBuilding(buildingType) {
  assertBuildingType(buildingType)

  const { data, error } = await supabase.rpc("upgrade_building", {
    p_building_type: buildingType,
  })
  if (error) {
    console.error("upgrade_building error:", error)
    throw error
  }
  return data
}
