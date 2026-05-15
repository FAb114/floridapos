import { useState, useMemo, useEffect } from 'react';
import { loadOrders, clearOrders } from '../data/orders.js';
import { printTicketDirect as printTicket } from '../data/printer.js';

export default function HistoryView({ onBack }) {
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    loadOrders().then(orders => setAllOrders(orders || []));
  }, []);
  const [filter, setFilter] = useState('today'); // today | week | all
  const [search, setSearch] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    let orders = allOrders;
    const now = new Date();

    if (filter === 'today') {
      orders = orders.filter(o => new Date(o.createdAt).toDateString() === now.toDateString());
    } else if (filter === 'week') {
      const weekAgo = new Date(now - 7 * 86400000);
      orders = orders.filter(o => new Date(o.createdAt) >= weekAgo);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      orders = orders.filter(o =>
        String(o.number).includes(q) ||
        o.tableNumber?.toLowerCase().includes(q) ||
        o.items.some(i => i.name.toLowerCase().includes(q))
      );
    }
    return orders;
  }, [allOrders, filter, search]);

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);

  const handleClear = () => {
    clearOrders();
    setAllOrders([]);
    setConfirmClear(false);
  };

  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 28px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', color: 'var(--text2)',
          fontSize: 22, cursor: 'pointer', padding: '4px 8px', borderRadius: 8
        }}>←</button>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: 'var(--orange)', lineHeight: 1 }}>
            📋 Historial de Pedidos
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text2)' }}>{filtered.length} pedidos · ${totalRevenue.toLocaleString('es-AR')} total</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Buscar pedido, mesa..."
            style={{
              padding: '8px 14px', borderRadius: 10, background: 'var(--bg3)',
              border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13,
              outline: 'none', width: 200
            }}
          />
          {/* Filter tabs */}
          {['today', 'week', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: filter === f ? 'var(--orange)' : 'var(--bg3)',
              color: filter === f ? '#000' : 'var(--text2)',
              border: '1px solid var(--border)'
            }}>
              {f === 'today' ? 'Hoy' : f === 'week' ? 'Semana' : 'Todo'}
            </button>
          ))}
          <button onClick={() => setConfirmClear(true)} style={{
            padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)'
          }}>🗑 Borrar todo</button>
        </div>
      </div>

      {/* Orders list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 56, opacity: 0.15, marginBottom: 16 }}>📋</div>
            <p style={{ color: 'var(--text2)', fontSize: 16 }}>No hay pedidos en este período</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900, margin: '0 auto' }}>
            {filtered.map(order => (
              <div key={order.number} style={{
                background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border)',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px'
                }}>
                  {/* Number badge */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: 'var(--orange)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Bebas Neue', fontSize: 22, color: '#000', flexShrink: 0
                  }}>#{order.number}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>
                        {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>🕐 {fmt(order.createdAt)}</span>
                      {order.tableNumber && (
                        <span style={{ fontSize: 12, color: 'var(--yellow)', fontWeight: 700 }}>
                          🪑 {order.tableNumber}
                        </span>
                      )}
                      {order.note && (
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>📝 {order.note}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: 'var(--yellow)', lineHeight: 1 }}>
                      ${order.total.toLocaleString('es-AR')}
                    </div>
                    <button onClick={() => printTicket(order)} style={{
                      marginTop: 6, padding: '5px 12px', borderRadius: 8,
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      color: 'var(--text2)', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                    }}>🖨️ Reimprimir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm clear modal */}
      {confirmClear && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg2)', borderRadius: 20, padding: '2rem',
            border: '2px solid var(--red)', textAlign: 'center', width: 320
          }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 26, color: 'var(--red)', marginBottom: 8 }}>
              ¿Borrar todo el historial?
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmClear(false)} style={{
                flex: 1, padding: '12px', borderRadius: 12, background: 'var(--bg4)',
                color: 'var(--text)', fontWeight: 700, fontSize: 14,
                border: '1px solid var(--border)', cursor: 'pointer'
              }}>Cancelar</button>
              <button onClick={handleClear} style={{
                flex: 1, padding: '12px', borderRadius: 12, background: 'var(--red)',
                color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer'
              }}>Sí, borrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
