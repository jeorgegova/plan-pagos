// src/components/Header.jsx
export default function Header({ user, onLogout, onExport }) {
  return (
    <div className="d-flex align-items-center mb-3">
      <h1 className="h4 mb-0">Plan de pagos – Fondo Truher</h1>
      <div className="ms-auto text-end">
        {user ? (
          <>
            <button onClick={onExport} className="btn btn-outline-accent btn-sm me-2">
              Exportar CSV
            </button>
            <button onClick={onLogout} className="btn btn-outline-accent btn-sm">
              Cerrar Sesión
            </button>
          </>
        ) : (
          <button
            className="btn btn-accent btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#loginModal"
          >
            Iniciar Sesión
          </button>
        )}
      </div>
    </div>
  )
}