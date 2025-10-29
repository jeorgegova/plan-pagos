import { useState } from 'react'

export default function PaymentRow({ payment, index, onUpdate, isEditable }) {
  const [obs, setObs] = useState(payment.obs || '')

  const handleObsChange = (e) => {
    const value = e.target.value
    setObs(value)
    onUpdate(index, 'obs', value)
  }

  return (
    <tr>
      <td>{payment.semana}</td>
      <td>{payment.label}</td>
      <td>${payment.valor.toLocaleString()}</td>
      <td className="text-center">
        <input
          type="checkbox"
          checked={payment.pagado}
          onChange={(e) => onUpdate(index, 'pagado', e.target.checked)}
          disabled={!isEditable}
        />
      </td>
      <td>
        <input
          type="date"
          className="form-control form-control-sm"
          value={payment.fecha_pago || ''}
          onChange={(e) => onUpdate(index, 'fecha_pago', e.target.value)}
          disabled={!isEditable}
        />
      </td>
      <td>${payment.saldo.toLocaleString()}</td>
      <td>
        <input
          className="form-control form-control-sm"
          value={obs}
          onChange={handleObsChange}
          disabled={!isEditable}
          placeholder="Notas..."
        />
      </td>
    </tr>
  )
}