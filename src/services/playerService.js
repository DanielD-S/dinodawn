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
