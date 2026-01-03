import { useState } from "react"
import { signUp } from "../services/authService"
import { useNavigate, Link } from "react-router-dom"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  async function handleRegister(e) {
    e.preventDefault()
    try {
      await signUp(email, password)
      navigate("/")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Registro</h2>

      <form onSubmit={handleRegister}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button>Crear cuenta</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        ¿Ya tienes cuenta? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
