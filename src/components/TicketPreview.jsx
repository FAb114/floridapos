import React, { useState } from 'react';
import { printTicketDirect, downloadTicketPDF } from '../data/printer.js';

const PAYMENT_LABELS = {
  efectivo: '💵 Efectivo',
  tarjeta: '💳 Tarjeta',
  transferencia: '📱 Transferencia',
};

export default function TicketPreview({ order, onClose }) {
  const [pdfState, setPdfState] = useState('idle'); // idle | loading | saved | error
  const [savedPath, setSavedPath] = useState(null);
  const [printing, setPrinting] = useState(false);

  if (!order) return null;

  const handlePrint = async () => {
    setPrinting(true);
    await printTicketDirect(order);
    setPrinting(false);
  };

  const handlePDF = async () => {
    setPdfState('loading');
    const result = await downloadTicketPDF(order);
    if (result?.success && result?.filePath) {
      setPdfState('saved');
      setSavedPath(result.filePath);
    } else if (result?.success === false && !result?.filePath) {
      // Usuario canceló el diálogo — volver a idle sin error
      setPdfState('idle');
    } else {
      setPdfState('error');
    }
  };

  const handleOpenPDF = () => {
    if (savedPath && window.electronAPI?.openFile) {
      window.electronAPI.openFile(savedPath);
    }
  };

  const handleShowInFolder = () => {
    if (savedPath && window.electronAPI?.showFile) {
      window.electronAPI.showFile(savedPath);
    }
  };

  const date = new Date(order.createdAt);
  const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('es-AR');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20
    }}>
      <div style={{
        background: 'var(--bg2)', borderRadius: 24, border: '1px solid var(--border)',
        display: 'flex', gap: 0, overflow: 'hidden', maxWidth: 720, width: '100%',
        maxHeight: '90vh', boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
      }}>

        {/* Left: ticket preview */}
        <div style={{
          flex: 1, background: '#fff', padding: '24px 20px', overflowY: 'auto',
          fontFamily: "'Courier New', monospace", fontSize: 13, color: '#000', minWidth: 240
        }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>** FLORIDA BURGERS **</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>Tel: 3487 681888</div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 2, fontSize: 12 }}>
            <span>Pedido #{order.number}</span>
            <span style={{ fontSize: 10 }}>{dateStr} {timeStr}</span>
          </div>
          {order.tableNumber && (
            <div style={{ fontWeight: 700, marginBottom: 2, fontSize: 12 }}>Mesa: {order.tableNumber}</div>
          )}
          {order.paymentMethod && (
            <div style={{ fontSize: 11, marginBottom: 2 }}>Pago: {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</div>
          )}
          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {order.items.map(item => (
                <React.Fragment key={item.key}>
                  <tr>
                    <td style={{ padding: '3px 0', fontSize: 12 }}>{item.qty}x {item.name}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0', fontSize: 12 }}>
                      ${(item.price * item.qty).toLocaleString('es-AR')}
                    </td>
                  </tr>
                  {item.itemNote && (
                    <tr>
                      <td colSpan={2} style={{ fontSize: 10, fontStyle: 'italic', color: '#555', paddingBottom: 3 }}>
                        → {item.itemNote}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
          {order.note && <div style={{ fontSize: 10, marginBottom: 6 }}>Nota: {order.note}</div>}
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: '#555' }}>
              <span>Subtotal</span>
              <span>${(order.subtotal || order.total + order.discount).toLocaleString('es-AR')}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: '#555' }}>
              <span>Descuento</span>
              <span>-${order.discount.toLocaleString('es-AR')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 15 }}>
            <span>TOTAL</span>
            <span>${order.total.toLocaleString('es-AR')}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
          <div style={{ textAlign: 'center', fontSize: 10, marginTop: 4 }}>
            ¡Gracias por su pedido!<br />Todos los combos incluyen papas
          </div>
        </div>

        {/* Right: actions */}
        <div style={{
          width: 270, padding: '28px 22px', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', flexShrink: 0
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#4caf5022', border: '1px solid #4caf5066',
              borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700,
              color: '#4caf50', marginBottom: 14
            }}>✓ Pedido confirmado</div>

            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 34, color: 'var(--orange)', lineHeight: 1, marginBottom: 4 }}>
              Pedido #{order.number}
            </h2>
            {order.tableNumber && (
              <p style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                🪑 {order.tableNumber}
              </p>
            )}
            {order.paymentMethod && (
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
                {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
              </p>
            )}
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 2 }}>
              {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
            </p>
            {order.discount > 0 && (
              <p style={{ fontSize: 12, color: '#4caf50', fontWeight: 700 }}>
                🏷 Descuento: -${order.discount.toLocaleString('es-AR')}
              </p>
            )}
            <p style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: 'var(--yellow)', marginTop: 6 }}>
              ${order.total.toLocaleString('es-AR')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={handlePrint} disabled={printing} style={{
              padding: '14px', borderRadius: 14,
              background: printing ? 'var(--bg4)' : 'var(--orange)',
              color: printing ? 'var(--text2)' : '#000',
              fontFamily: 'Bebas Neue', fontSize: 20,
              border: 'none', cursor: printing ? 'default' : 'pointer',
              letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              🖨️ {printing ? 'Imprimiendo...' : 'Imprimir ticket'}
            </button>

            {/* Botón PDF — cambia según estado */}
            {pdfState === 'idle' && (
              <button onClick={handlePDF} style={{
                padding: '14px', borderRadius: 14,
                background: 'var(--bg3)', color: 'var(--text)',
                fontFamily: 'Bebas Neue', fontSize: 20,
                border: '1px solid var(--border)', cursor: 'pointer',
                letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                📄 Guardar PDF
              </button>
            )}

            {pdfState === 'loading' && (
              <button disabled style={{
                padding: '14px', borderRadius: 14,
                background: 'var(--bg3)', color: 'var(--text2)',
                fontFamily: 'Bebas Neue', fontSize: 20,
                border: '1px solid var(--border)', cursor: 'default',
                letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                ⏳ Guardando...
              </button>
            )}

            {pdfState === 'saved' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 14,
                  background: '#4caf5015', border: '1px solid #4caf5055',
                  color: '#4caf50', fontSize: 13, fontWeight: 700, textAlign: 'center'
                }}>
                  ✓ PDF guardado
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handleOpenPDF} style={{
                    flex: 1, padding: '10px', borderRadius: 12,
                    background: 'var(--orange)', color: '#000',
                    fontFamily: 'Bebas Neue', fontSize: 16,
                    border: 'none', cursor: 'pointer', letterSpacing: 0.5,
                  }}>
                    📂 Abrir
                  </button>
                  <button onClick={handleShowInFolder} style={{
                    flex: 1, padding: '10px', borderRadius: 12,
                    background: 'var(--bg3)', color: 'var(--text)',
                    fontFamily: 'Bebas Neue', fontSize: 16,
                    border: '1px solid var(--border)', cursor: 'pointer', letterSpacing: 0.5,
                  }}>
                    📁 Carpeta
                  </button>
                </div>
              </div>
            )}

            {pdfState === 'error' && (
              <button onClick={() => setPdfState('idle')} style={{
                padding: '14px', borderRadius: 14,
                background: '#ff444415', color: '#ff4444',
                fontFamily: 'Bebas Neue', fontSize: 18,
                border: '1px solid #ff444444', cursor: 'pointer',
                letterSpacing: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                ✗ Error — Reintentar
              </button>
            )}

            <button onClick={onClose} style={{
              padding: '12px', borderRadius: 14, background: 'transparent',
              color: 'var(--text2)', fontFamily: 'Bebas Neue', fontSize: 17,
              border: '1px solid var(--border)', cursor: 'pointer', letterSpacing: 0.5
            }}>
              ✓ Guardar sin imprimir
            </button>

            <p style={{ fontSize: 10, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.4, opacity: 0.6 }}>
              El pedido ya quedó guardado en el historial · Enter para cerrar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
