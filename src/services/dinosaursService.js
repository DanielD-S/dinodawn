import { supabase } from "../lib/supabaseClient"

export async function getDinosaurs() {
  const { data, error } = await supabase
    .from("dinosaurs")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function trainDinosaur(kind) {
  const { data, error } = await supabase.rpc("train_dinosaur", {
    dino_kind: kind,
  })
  if (error) throw error
  return data // { resources, dinosaur }
}

export async function claimTrainedDinosaurs() {
  const { data, error } = await supabase.rpc("claim_trained_dinosaurs")
  if (error) throw error
  return data // número de dinos reclamados
}
