// src/components/Login.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Register from './Register'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showRegister, setShowRegister] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
        else window.location.reload()
    }

    return (
        <div className="login-card">
            <div className="login-header">
                <h3>{showRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h3>
            </div>

            <div className="login-body">
                {!showRegister ? (
                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Contraseña"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="alert alert-danger">
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-100 mb-3">
                            Entrar
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                className="btn btn-link p-0"
                                onClick={() => setShowRegister(true)}
                            >
                                ¿No tienes cuenta? Regístrate aquí
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <Register onSuccess={() => setShowRegister(false)} />
                        <div className="text-center mt-3">
                            <button
                                type="button"
                                className="btn btn-link p-0"
                                onClick={() => setShowRegister(false)}
                            >
                                ← Volver al inicio de sesión
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}