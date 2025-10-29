// src/components/PaymentTable.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { compressImage, generateThumbnail } from '../lib/imageUtils'

const TOTAL_DEUDA = 2000000

export default function PaymentTable({ user }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from('pagos')
      .select('*, comprobante_url')
      .order('semana', { ascending: true })

    if (error) {
      alert('Error: ' + error.message)
      return
    }
    setPayments(recomputeSaldo(data))
    setLoading(false)
  }

  const recomputeSaldo = (data) => {
    let saldo = TOTAL_DEUDA
    return data.map(p => {
      if (p.pagado) saldo -= p.valor
      return { ...p, saldo: Math.max(saldo, 0) }
    })
  }

  const updatePayment = async (index, field, value) => {
    if (!user) {
      alert('Debes iniciar sesión para editar.')
      return
    }

    const payment = payments[index]
    const updates = { [field]: value }

    if (field === 'pagado' && value && !payment.fecha_pago) {
      updates.fecha_pago = new Date().toISOString().slice(0, 10)
    }
    if (field === 'pagado' && !value) {
      updates.fecha_pago = null
    }

    const { error } = await supabase
      .from('pagos')
      .update(updates)
      .eq('semana', payment.semana)

    if (!error) {
      const updated = [...payments]
      updated[index] = { ...updated[index], ...updates }
      setPayments(recomputeSaldo(updated))
    }
  }

  const uploadReceipt = async (file, semana) => {
    if (!file) return null

    try {
      setUploading(true)

      // Compress the image
      const compressedFile = await compressImage(file)

      // Generate unique filename
      const fileName = `comprobante_semana_${semana}_${Date.now()}.jpg`

      // Upload to Supabase Storage with proper headers
      const { data, error } = await supabase.storage
        .from('comprobantePago')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('comprobantePago')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading receipt:', error)
      alert('Error al subir el comprobante: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  const uploadReceiptForPayment = async (index) => {
    if (!user) {
      alert('Debes iniciar sesión para subir comprobantes.')
      return
    }

    const payment = payments[index]

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Prefer camera on mobile

    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        const receiptUrl = await uploadReceipt(file, payment.semana)
        if (receiptUrl) {
          updatePayment(index, 'comprobante_url', receiptUrl)
        }
      }
    }

    input.click()
  }

  const addManualPayment = async () => {
    if (!user) {
      alert('Debes iniciar sesión.')
      return
    }

    const week = parseInt(prompt('Semana # (1-20):'))
    const amount = parseInt(prompt('Valor:', '100000')) || 100000
    const date = prompt('Fecha (YYYY-MM-DD):') || new Date().toISOString().slice(0, 10)

    if (!week || week < 1 || week > 20) return alert('Semana inválida')

    const idx = payments.findIndex(p => p.semana === week)
    if (idx === -1) return alert('Semana no encontrada')

    // Handle file upload
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Prefer camera on mobile

    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        const receiptUrl = await uploadReceipt(file, week)
        if (receiptUrl) {
          updatePayment(idx, 'comprobante_url', receiptUrl)
        }
      }

      // Update payment details
      updatePayment(idx, 'valor', amount)
      updatePayment(idx, 'pagado', true)
      updatePayment(idx, 'fecha_pago', date)
    }

    input.click()
  }

  const exportCSV = () => {
    const header = ['Semana', 'Label', 'Valor', 'Pagado', 'Fecha', 'Saldo', 'Obs', 'Comprobante']
    const rows = payments.map(p => [
      p.semana, p.label, p.valor,
      p.pagado ? 'SI' : 'NO', p.fecha_pago || '',
      p.saldo, p.obs || '', p.comprobante_url || ''
    ])
    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plan_pagos_truher.csv'
    a.click()
  }

  if (loading) return <div className="text-center py-4">Cargando...</div>

  const isEditable = !!user

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Semana</th>
              <th>Valor</th>
              <th className="text-center">Pagado</th>
              <th>Fecha</th>
              <th>Saldo</th>
              <th>Observaciones</th>
              <th>Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={p.semana} className={p.pagado ? 'table-success' : ''}>
                <td><strong>{p.semana}</strong></td>
                <td>{p.label}</td>
                <td><strong>${p.valor.toLocaleString()}</strong></td>
                <td className="text-center">
                  {isEditable ? (
                    <input
                      type="checkbox"
                      checked={p.pagado}
                      onChange={e => updatePayment(i, 'pagado', e.target.checked)}
                    />
                  ) : (
                    <span className={p.pagado ? 'badge-paid' : 'badge-pending'}>
                      {p.pagado ? 'Sí' : 'No'}
                    </span>
                  )}
                </td>
                <td>
                  {isEditable ? (
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={p.fecha_pago || ''}
                      onChange={e => updatePayment(i, 'fecha_pago', e.target.value)}
                    />
                  ) : (
                    p.fecha_pago || '-'
                  )}
                </td>
                <td><strong style={{ color: 'var(--red-dark)' }}>${p.saldo.toLocaleString()}</strong></td>
                <td>
                  {isEditable ? (
                    <input
                      className="form-control form-control-sm"
                      value={p.obs || ''}
                      onChange={e => updatePayment(i, 'obs', e.target.value)}
                      placeholder="Notas..."
                    />
                  ) : (
                    p.obs || '-'
                  )}
                </td>
                <td className="text-center">
                  {p.comprobante_url ? (
                    <img
                      src={p.comprobante_url}
                      alt={`Comprobante semana ${p.semana}`}
                      className="receipt-thumbnail"
                      onClick={() => setSelectedImage(p.comprobante_url)}
                      style={{ cursor: 'pointer', width: '60px', height: '60px', objectFit: 'cover' }}
                    />
                  ) : (
                    isEditable ? (
                      <button
                        onClick={() => uploadReceiptForPayment(i)}
                        className="btn btn-sm btn-outline-primary"
                        disabled={uploading}
                        title="Subir comprobante"
                      >
                        📎
                      </button>
                    ) : (
                      <span className="text-muted">-</span>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {user && (
        <div className="mt-4 d-flex gap-2">
          <button onClick={addManualPayment} className="btn btn-accent" disabled={uploading}>
            {uploading ? 'Subiendo...' : 'Agregar Pago Manual'}
          </button>
          <button onClick={exportCSV} className="btn btn-outline-accent">
            Exportar CSV
          </button>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={() => setSelectedImage(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Comprobante de Pago</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedImage(null)}></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={selectedImage}
                  alt="Comprobante ampliado"
                  className="img-fluid rounded"
                  style={{ maxHeight: '70vh', maxWidth: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}