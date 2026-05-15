import { useState, useEffect, useRef } from 'react';

const STATUS_COLORS = {
  pending:    { bg: '#f5820d22', border: '#f5820d', label: 'NUEVO',      icon: '🔔' },
  preparing:  { bg: '#3a86ff22', border: '#3a86ff', label: 'EN COCINA',  icon: '👨‍🍳' },
  ready:      { bg: '#4caf5022', border: '#4caf50', label: 'LISTO',      icon: '✅' },
};

function OrderCard({ order, onStatusChange }) {
  const status = order.kitchenStatus || 'pending';
  const colors = STATUS_COLORS[status];
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
  const [secs, setSecs] = useState(elapsed);

  useEffect(() => {
    if (status === 'ready') return;
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const mins = Math.floor(secs / 60);
  const secsDisplay = secs % 60;
  const isUrgent = secs > 600 && status !== 'ready'; // > 10 min

  const nextStatus = status === 'pending' ? 'preparing' : status === 'preparing' ? 'ready' : null;
  const nextLabel  = status === 'pending' ? '👨‍🍳 Iniciar' : status === 'preparing' ? '✅ Listo' : null;

  return (
    <div style={{
      background: colors.bg, border: `2px solid ${isUrgent ? '#c0392b' : colors.border}`,
      borderRadius: 18, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10,
      animation: status === 'pending' ? 'pulseIn 0.4s ease' : 'none',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Urgent stripe */}
      {isUrgent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'repeating-linear-gradient(45deg,#c0392b,#c0392b 8px,#e74c3c 8px,#e74c3c 16px)',
        }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: colors.border, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Bebas Neue', fontSize: 20, color: '#000', fontWeight: 900, flexShrink: 0
          }}>#{order.number}</div>
          <div>
            {order.tableNumber && (
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--yellow)' }}>
                🪑 {order.tableNumber}
              </div>
            )}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: colors.border + '33', borderRadius: 6, padding: '2px 8px',
              fontSize: 11, fontWeight: 800, color: colors.border
            }}>
              {colors.icon} {colors.label}
            </div>
          </div>
        </div>

        {/* Timer */}
        <div style={{
          textAlign: 'right', fontFamily: 'Bebas Neue',
          color: isUrgent ? '#c0392b' : 'var(--text2)',
        }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>
            {String(mins).padStart(2,'0')}:{String(secsDisplay).padStart(2,'0')}
          </div>
          <div style={{ fontSize: 10, opacity: 0.7 }}>transcurrido</div>
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {order.items.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px'
          }}>
            <span style={{
              minWidth: 28, height: 28, borderRadius: 8,
              background: colors.border, color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 14, flexShrink: 0
            }}>{item.qty}</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.name}</span>
          </div>
        ))}
      </div>

      {/* Note */}
      {order.note && (
        <div style={{
          background: '#f5c51811', border: '1px solid #f5c51844',
          borderRadius: 8, padding: '6px 10px',
          fontSize: 12, color: 'var(--yellow)', fontWeight: 600
        }}>
          📝 {order.note}
        </div>
      )}

      {/* Action button */}
      {nextStatus && (
        <button onClick={() => onStatusChange(order.number, nextStatus)} style={{
          padding: '10px', borderRadius: 12,
          background: nextStatus === 'ready' ? '#4caf50' : '#3a86ff',
          color: '#fff', fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 0.5,
          border: 'none', cursor: 'pointer', fontWeight: 700
        }}>
          {nextLabel}
        </button>
      )}
      {status === 'ready' && (
        <div style={{
          padding: '10px', borderRadius: 12, background: '#4caf5022',
          border: '1px solid #4caf5044', textAlign: 'center',
          fontFamily: 'Bebas Neue', fontSize: 18, color: '#4caf50'
        }}>
          ✅ LISTO PARA ENTREGAR
        </div>
      )}
    </div>
  );
}

export default function KitchenView({ onBack }) {
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [filter, setFilter] = useState('active'); // 'active' | 'ready' | 'all'
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtx = useRef(null);
  const prevCountRef = useRef(0);

  // Poll orders from storage every 2 seconds
  useEffect(() => {
    const poll = async () => {
      const { loadOrders } = await import('../data/orders.js');
      const orders = await loadOrders();
      // Only show orders from last 4 hours
      const cutoff = Date.now() - 4 * 3600 * 1000;
      const recent = orders
        .filter(o => new Date(o.createdAt).getTime() > cutoff)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // oldest first

      // Detect new orders (more than before)
      if (recent.length > prevCountRef.current && prevCountRef.current > 0) {
        setNewOrderAlert(true);
        playBeep();
        setTimeout(() => setNewOrderAlert(false), 3000);
      }
      prevCountRef.current = recent.length;
      setKitchenOrders(recent);
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        gain2.gain.setValueAtTime(0.4, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.4);
      }, 200);
    } catch {}
  };

  const handleStatusChange = async (orderNumber, newStatus) => {
    // Update kitchenStatus in the orders storage
    const { loadOrders } = await import('../data/orders.js');
    const { storageSet } = await import('../data/storage.js');
    const orders = await loadOrders();
    const updated = orders.map(o =>
      o.number === orderNumber ? { ...o, kitchenStatus: newStatus } : o
    );
    await storageSet('orders', updated);
    setKitchenOrders(prev => prev.map(o =>
      o.number === orderNumber ? { ...o, kitchenStatus: newStatus } : o
    ));

    if (newStatus === 'ready') playBeep();
  };

  const filtered = kitchenOrders.filter(o => {
    const s = o.kitchenStatus || 'pending';
    if (filter === 'active') return s !== 'ready';
    if (filter === 'ready') return s === 'ready';
    return true;
  });

  const pendingCount = kitchenOrders.filter(o => !o.kitchenStatus || o.kitchenStatus === 'pending').length;
  const preparingCount = kitchenOrders.filter(o => o.kitchenStatus === 'preparing').length;
  const readyCount = kitchenOrders.filter(o => o.kitchenStatus === 'ready').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <style>{`
        @keyframes pulseIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes alertPulse { 0%,100% { background: #c0392b; } 50% { background: #e74c3c; } }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '12px 24px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer'
        }}>←</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>👨‍🍳</span>
          <div>
            <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: 'var(--orange)', lineHeight: 1 }}>
              Pantalla de Cocina
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text2)' }}>Se actualiza automáticamente cada 2 segundos</p>
          </div>
        </div>

        {/* Status counters */}
        <div style={{ display: 'flex', gap: 10, marginLeft: 20 }}>
          {[
            { label: 'Nuevos', count: pendingCount, color: '#f5820d' },
            { label: 'En cocina', count: preparingCount, color: '#3a86ff' },
            { label: 'Listos', count: readyCount, color: '#4caf50' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.color + '22', border: `1px solid ${s.color}55`,
              borderRadius: 10, padding: '6px 14px', textAlign: 'center'
            }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: s.color, lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Sound toggle */}
          <button onClick={() => setSoundEnabled(s => !s)} style={{
            padding: '8px 14px', borderRadius: 10, fontSize: 18, cursor: 'pointer',
            background: soundEnabled ? '#f5820d22' : 'var(--bg3)',
            border: `1px solid ${soundEnabled ? '#f5820d55' : 'var(--border)'}`,
          }} title={soundEnabled ? 'Silenciar' : 'Activar sonido'}>
            {soundEnabled ? '🔔' : '🔕'}
          </button>

          {/* Filter tabs */}
          {[['active','Activos'],['ready','Listos'],['all','Todos']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: filter === v ? 'var(--orange)' : 'var(--bg3)',
              color: filter === v ? '#000' : 'var(--text2)', border: '1px solid var(--border)'
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* New order alert banner */}
      {newOrderAlert && (
        <div style={{
          padding: '12px 24px', textAlign: 'center',
          fontFamily: 'Bebas Neue', fontSize: 22, color: '#fff', letterSpacing: 2,
          animation: 'alertPulse 0.4s ease infinite'
        }}>
          🔔 ¡NUEVO PEDIDO ENTRANTE!
        </div>
      )}

      {/* Orders grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 72, opacity: 0.15, marginBottom: 20 }}>👨‍🍳</div>
            <p style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: 'var(--text2)', letterSpacing: 1 }}>
              {filter === 'active' ? 'No hay pedidos activos' :
               filter === 'ready' ? 'No hay pedidos listos' : 'No hay pedidos recientes'}
            </p>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 8, opacity: 0.6 }}>
              Los pedidos confirmados en el POS aparecen aquí automáticamente
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(order => (
              <OrderCard
                key={order.number}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
