import { useState } from 'react';

const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: '💵' },
  { id: 'tarjeta', label: 'Tarjeta', icon: '💳' },
  { id: 'transferencia', label: 'Transf.', icon: '📱' },
];

export default function Cart({
  cart, onUpdate, onClear, onConfirm, totalPrice,
  orderNote, setOrderNote, tableNumber,
  showNoteInput, setShowNoteInput,
  paymentMethod, setPaymentMethod,
  discount, setDiscount,
  itemNotes, setItemNotes,
}) {
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState('pct'); // 'pct' | 'fixed'
  const [discountValue, setDiscountValue] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [editingNoteKey, setEditingNoteKey] = useState(null);

  const discountAmount = (() => {
    const v = parseFloat(discountValue) || 0;
    if (discountType === 'pct') return Math.round(totalPrice * v / 100);
    return Math.min(v, totalPrice);
  })();
  const finalTotal = totalPrice - discountAmount;

  const change = paymentMethod === 'efectivo'
    ? (parseFloat(cashReceived) || 0) - finalTotal
    : null;

  const applyDiscount = () => {
    setDiscount({ type: discountType, value: parseFloat(discountValue) || 0, amount: discountAmount });
    setShowDiscount(false);
  };

  const removeDiscount = () => {
    setDiscount(null);
    setDiscountValue('');
    setShowDiscount(false);
  };

  const handleItemNoteChange = (key, note) => {
    setItemNotes(prev => ({ ...prev, [key]: note }));
  };

  return (
    <div style={{
      width: 320, background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
      }}>
        <div>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: 'var(--orange)', lineHeight: 1 }}>
            Pedido actual
          </h2>
          <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
            {totalItems > 0 ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'}` : 'Sin items'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {tableNumber && (
            <div style={{
              background: 'var(--bg3)', borderRadius: 8, padding: '3px 8px',
              fontSize: 11, fontWeight: 800, color: 'var(--yellow)'
            }}>🪑 {tableNumber}</div>
          )}
          {cart.length > 0 && (
            <button onClick={onClear} style={{
              padding: '4px 9px', borderRadius: 8, background: 'var(--bg4)',
              color: 'var(--text2)', fontSize: 11, fontWeight: 700,
              border: '1px solid var(--border)', cursor: 'pointer'
            }}>Vaciar</button>
          )}
        </div>
      </div>

      {/* Items list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {cart.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 44, opacity: 0.15, marginBottom: 10 }}>🛒</div>
            <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
              Tocá un producto del menú para agregarlo
            </p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.key} style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700, marginTop: 2 }}>
                    ${(item.price * item.qty).toLocaleString('es-AR')}
                    <span style={{ color: 'var(--text2)', fontWeight: 400, marginLeft: 4 }}>
                      (${item.price.toLocaleString('es-AR')} c/u)
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => onUpdate(item.key, -1)} style={{
                    width: 26, height: 26, borderRadius: 7, background: 'var(--bg4)',
                    color: 'var(--text)', fontSize: 16, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border)', cursor: 'pointer'
                  }}>−</button>
                  <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 800, fontSize: 14 }}>
                    {item.qty}
                  </span>
                  <button onClick={() => onUpdate(item.key, 1)} style={{
                    width: 26, height: 26, borderRadius: 7, background: 'var(--orange)',
                    color: '#000', fontSize: 16, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', cursor: 'pointer'
                  }}>+</button>
                </div>
              </div>
              {/* Nota por ítem */}
              <div style={{ padding: '0 16px 8px' }}>
                {editingNoteKey === item.key ? (
                  <input
                    autoFocus
                    value={itemNotes[item.key] || ''}
                    onChange={e => handleItemNoteChange(item.key, e.target.value)}
                    onBlur={() => setEditingNoteKey(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditingNoteKey(null)}
                    placeholder="Aclaración (ej: sin cebolla)..."
                    style={{
                      width: '100%', padding: '5px 10px', borderRadius: 8,
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      color: 'var(--text)', fontSize: 11, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                ) : (
                  <button onClick={() => setEditingNoteKey(item.key)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: itemNotes[item.key] ? 'var(--yellow)' : 'var(--text2)',
                    fontSize: 11, padding: 0, textAlign: 'left'
                  }}>
                    📝 {itemNotes[item.key] || 'Agregar aclaración...'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nota general */}
      {cart.length > 0 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {showNoteInput ? (
            <textarea
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              placeholder="Nota general del pedido..."
              rows={2}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 10,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 12, resize: 'none', outline: 'none', boxSizing: 'border-box'
              }}
            />
          ) : (
            <button onClick={() => setShowNoteInput(true)} style={{
              width: '100%', padding: '7px', borderRadius: 10, background: 'transparent',
              border: '1px dashed var(--border)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer'
            }}>
              📋 {orderNote || 'Nota general del pedido'}
            </button>
          )}
        </div>
      )}

      {/* Descuento */}
      {cart.length > 0 && (
        <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
          {discount ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: 8, background: '#4caf5015', border: '1px solid #4caf5040'
            }}>
              <span style={{ fontSize: 12, color: '#4caf50', fontWeight: 700 }}>
                🏷 Descuento {discount.type === 'pct' ? `${discount.value}%` : `$${discount.value.toLocaleString('es-AR')}`}: −${discount.amount.toLocaleString('es-AR')}
              </span>
              <button onClick={removeDiscount} style={{
                background: 'transparent', border: 'none', color: 'var(--red)', fontSize: 14, cursor: 'pointer', fontWeight: 700
              }}>×</button>
            </div>
          ) : showDiscount ? (
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {['pct', 'fixed'].map(t => (
                  <button key={t} onClick={() => setDiscountType(t)} style={{
                    flex: 1, padding: '5px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: discountType === t ? 'var(--orange)' : 'var(--bg4)',
                    color: discountType === t ? '#000' : 'var(--text2)',
                    border: '1px solid var(--border)'
                  }}>{t === 'pct' ? 'Porcentaje (%)' : 'Monto fijo ($)'}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  autoFocus type="number" min="0"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyDiscount()}
                  placeholder={discountType === 'pct' ? 'Ej: 10' : 'Ej: 1000'}
                  style={{
                    flex: 1, padding: '7px 10px', borderRadius: 8,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: 13, outline: 'none'
                  }}
                />
                <button onClick={applyDiscount} style={{
                  padding: '7px 12px', borderRadius: 8, background: 'var(--orange)',
                  color: '#000', fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer'
                }}>OK</button>
                <button onClick={() => setShowDiscount(false)} style={{
                  padding: '7px 10px', borderRadius: 8, background: 'var(--bg4)',
                  color: 'var(--text2)', fontSize: 12, border: '1px solid var(--border)', cursor: 'pointer'
                }}>✕</button>
              </div>
              {discountValue && (
                <p style={{ fontSize: 11, color: '#4caf50', marginTop: 6, fontWeight: 700 }}>
                  Descuento: −${discountAmount.toLocaleString('es-AR')} → Total: ${(totalPrice - discountAmount).toLocaleString('es-AR')}
                </p>
              )}
            </div>
          ) : (
            <button onClick={() => setShowDiscount(true)} style={{
              width: '100%', padding: '6px', borderRadius: 8, background: 'transparent',
              border: '1px dashed var(--border)', color: 'var(--text2)', fontSize: 11, cursor: 'pointer'
            }}>🏷 Agregar descuento</button>
          )}
        </div>
      )}

      {/* Método de pago */}
      {cart.length > 0 && (
        <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Método de pago</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {PAYMENT_METHODS.map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)} style={{
                flex: 1, padding: '7px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: paymentMethod === m.id ? 'var(--orange)' : 'var(--bg3)',
                color: paymentMethod === m.id ? '#000' : 'var(--text2)',
                border: `1px solid ${paymentMethod === m.id ? 'var(--orange)' : 'var(--border)'}`,
                transition: 'all 0.12s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
              }}>
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
          {/* Vuelto efectivo */}
          {paymentMethod === 'efectivo' && (
            <div style={{ marginTop: 8 }}>
              <input
                type="number" min="0"
                value={cashReceived}
                onChange={e => setCashReceived(e.target.value)}
                placeholder="Monto recibido..."
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 8, boxSizing: 'border-box',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 13, outline: 'none'
                }}
              />
              {change !== null && parseFloat(cashReceived) > 0 && (
                <div style={{
                  marginTop: 6, padding: '6px 10px', borderRadius: 8,
                  background: change >= 0 ? '#4caf5015' : '#e6394615',
                  border: `1px solid ${change >= 0 ? '#4caf5040' : '#e6394640'}`,
                  fontSize: 13, fontWeight: 800,
                  color: change >= 0 ? '#4caf50' : 'var(--red)'
                }}>
                  {change >= 0
                    ? `Vuelto: $${change.toLocaleString('es-AR')}`
                    : `Falta: $${Math.abs(change).toLocaleString('es-AR')}`}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Total & Confirmar */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
            <span style={{ color: 'var(--text2)' }}>Subtotal</span>
            <span style={{ color: 'var(--text2)', textDecoration: 'line-through' }}>${totalPrice.toLocaleString('es-AR')}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ color: 'var(--text2)', fontWeight: 700, fontSize: 13 }}>TOTAL</span>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 34, color: 'var(--yellow)', lineHeight: 1 }}>
            ${finalTotal.toLocaleString('es-AR')}
          </span>
        </div>

        <button
          onClick={() => onConfirm(finalTotal, discountAmount)}
          disabled={cart.length === 0}
          style={{
            width: '100%', padding: '16px', borderRadius: 12,
            background: cart.length > 0 ? 'var(--orange)' : 'var(--bg4)',
            color: cart.length > 0 ? '#000' : 'var(--text2)',
            fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 0.5,
            cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
            border: 'none', transition: 'background 0.15s'
          }}
        >
          {cart.length === 0 ? 'Sin items' : '✓ Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}
