import { useEffect, useState } from "react"
import {
  loadResources,
  saveResources,
  calculateResources,
} from "./services/resources"

export default function App() {
  const [resources, setResources] = useState(loadResources())

  useEffect(() => {
    const interval = setInterval(() => {
      setResources((prev) => {
        const updated = calculateResources(prev)
        saveResources(updated)
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
     <div
      style={{
        padding: 24,
        fontFamily: "system-ui",
        color: "#111",
        background: "#fff",
        minHeight: "100vh",
      }}
    >
      <h1>Dino Dawn – MVP v0.1</h1>
      <p>Si ves esto, el render está OK.</p>
    </div>
  )
}
