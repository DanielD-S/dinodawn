import { supabase } from "../lib/supabaseClient"

const ALLOWED_KINDS = new Set(["theropod", "herbivore", "flyer", "aquatic"])

export async function getDinosaurs() {
  const { data, error } = await supabase
    .from("dinosaurs")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getDinosaurs error:", error)
    throw error
  }
  return data ?? []
}

export async function trainDinosaur(kind) {
  if (!ALLOWED_KINDS.has(kind)) {
    throw new Error("Tipo de dinosaurio inválido")
  }

  const { data, error } = await supabase.rpc("train_dinosaur", {
    dino_kind: kind, // debe calzar con el nombre del parámetro en SQL
  })

  if (error) {
    console.error("train_dinosaur error:", error)
    throw error
  }
  return data // { resources, dinosaur }
}

export async function claimTrainedDinosaurs() {
  const { data, error } = await supabase.rpc("claim_trained_dinosaurs")

  if (error) {
    console.error("claim_trained_dinosaurs error:", error)
    throw error
  }
  return data // int
}
