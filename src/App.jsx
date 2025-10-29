// src/App.jsx
// src/App.jsx
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Header from './components/Header'
import PaymentTable from './components/PaymentTable'
import Login from './components/Login'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" style={{ width: '3rem', height: '3rem' }}></div>
      </div>
    )
  }

  // src/App.jsx
  return (
    <div className="app-container">
      {/* USAMOS EL COMPONENTE HEADER */}
      <Header user={user} onLogout={handleLogout} />

      <div className="mb-4">
        <p className="text-muted">
          Monto semanal: <strong style={{ color: 'var(--red-dark)' }}>$100.000</strong>.
          Total deuda: <strong style={{ color: 'var(--red-dark)' }}>$2.000.000</strong>.
        </p>
      </div>


      <PaymentTable user={user} />

      {/* Modal */}
      <div className="modal fade" id="loginModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content login-card">
            <div className="modal-header border-0 pb-0">
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body pt-0">
              <Login />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}