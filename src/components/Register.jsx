// src/components/Register.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const CODIGO_SECRETO = '1053824436'

export default function Register({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (codigo !== CODIGO_SECRETO) {
      setError('Código secreto incorrecto')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin }
    })

    if (error) {
      setError(error.message)
    } else {
      alert('¡Registro exitoso! Revisa tu correo para confirmar.')
      onSuccess?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleRegister}>
      <div className="mb-3">
        <input
          type="email"
          className="form-control"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="mb-3">
        <input
          type="password"
          className="form-control"
          placeholder="Contraseña (mín. 6 caracteres)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength="6"
          disabled={loading}
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Código de registro"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-success w-100"
        disabled={loading}
      >
        {loading ? 'Creando cuenta...' : 'Registrarse'}
      </button>
    </form>
  )
}