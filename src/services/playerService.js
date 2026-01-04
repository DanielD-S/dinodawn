import { supabase } from "../lib/supabaseClient"

// ==========================
// BOOTSTRAP / CORE
// ==========================
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
    .single() // RLS asegura que sea la del usuario
  if (error) throw error
  return data
}

export async function getResources() {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .single() // 1 fila por usuario
  if (error) throw error
  return data
}

// ==========================
// RECURSOS / PRODUCCIÓN
// ==========================
export async function collectResources() {
  const { data, error } = await supabase.rpc("collect_resources")
  if (error) {
    console.error("collect_resources error:", error)
    throw error
  }
  return data
}

export async function getProductionRates() {
  const { data, error } = await supabase.rpc("get_my_buildings_view")
  if (error) throw error

  const sum = (key) =>
    (data ?? []).reduce((acc, row) => acc + Number(row[key] ?? 0), 0)

  return {
    plants_per_hour: sum("prod_plants_per_hour"),
    bones_per_hour: sum("prod_bones_per_hour"),
    meat_per_hour: sum("prod_meat_per_hour"),
  }
}

// ==========================
// BUILDINGS (helpers)
// ==========================
export async function ensureBaseBuildings() {
  const { error } = await supabase.rpc("ensure_base_buildings")
  if (error) throw error
}
