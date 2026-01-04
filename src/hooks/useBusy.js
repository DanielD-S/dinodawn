import { useMemo, useState } from "react"

const initial = {
  hardRefresh: false,
  collect: false,
  upgradeStorage: false,
  trainKind: null,
  claim: false,
  startAttackId: null,
  resolveAttackId: null,
}

export function useBusy() {
  const [busy, setBusy] = useState(initial)

  const anyBusy = useMemo(
    () => Object.values(busy).some((v) => v !== null && v !== false),
    [busy]
  )

  function setFlag(key, value) {
    setBusy((b) => ({ ...b, [key]: value }))
  }

  return { busy, setBusy, setFlag, anyBusy }
}
