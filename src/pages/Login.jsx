import { useState } from "react"
import { signIn } from "../services/authService"
import { useNavigate, Link } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    try {
      await signIn(email, password)
      navigate("/")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
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
        <button>Entrar</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  )
}
