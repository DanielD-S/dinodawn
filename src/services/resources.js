const STORAGE_KEY = "dino_resources"

const INITIAL_STATE = {
  wood: 100,
  bones: 50,
  food: 80,
  lastUpdate: Date.now(),
}

const PRODUCTION = {
  wood: 1,
  bones: 0.5,
  food: 0.8,
}

const STORAGE_LIMIT = 500

export function loadResources() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved ? JSON.parse(saved) : INITIAL_STATE
}

export function saveResources(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function calculateResources(state) {
  const now = Date.now()
  const elapsedSeconds = Math.floor((now - state.lastUpdate) / 1000)

  if (elapsedSeconds <= 0) return state

  const next = { ...state }

  Object.keys(PRODUCTION).forEach((key) => {
    next[key] = Math.min(
      STORAGE_LIMIT,
      state[key] + PRODUCTION[key] * elapsedSeconds
    )
  })

  next.lastUpdate = now
  return next
}
