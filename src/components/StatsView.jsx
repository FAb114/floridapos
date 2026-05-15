import { useState, useMemo, useEffect } from 'react';
import { loadOrders } from '../data/orders.js';
import { exportStatsToExcel } from '../data/excelExport.js';

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 140, fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 28, background: 'var(--bg4)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          borderRadius: 8, transition: 'width 0.5s ease', minWidth: pct > 0 ? 4 : 0
        }} />
        <span style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          fontSize: 12, fontWeight: 800, color: 'var(--text)'
        }}>{value}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--bg2)', borderRadius: 16, padding: '1.25rem 1.5rem',
      border: `1px solid ${color}33`, flex: 1, minWidth: 140
    }}>
      <p style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: 'Bebas Neue', fontSize: 36, color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function StatsView({ onBack }) {
  const [period, setPeriod] = useState('today');
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    loadOrders().then(orders => setAllOrders(orders || []));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    const periodLabels = { today: 'Hoy', week: 'Última semana', month: 'Último mes', all: 'Todo el historial' };
    await exportStatsToExcel(filtered, periodLabels[period]);
    setExporting(false);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const filtered = useMemo(() => {
    const now = new Date();
    if (period === 'today') return allOrders.filter(o => new Date(o.createdAt).toDateString() === now.toDateString());
    if (period === 'week') return allOrders.filter(o => new Date(o.createdAt) >= new Date(now - 7 * 86400000));
    if (period === 'month') return allOrders.filter(o => new Date(o.createdAt) >= new Date(now - 30 * 86400000));
    return allOrders;
  }, [allOrders, period]);

  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
    const totalOrders = filtered.length;
    const avgTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Caja por metodo de pago
    const byPayment = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    filtered.forEach(o => {
      const m = o.paymentMethod;
      if (m in byPayment) byPayment[m] += o.total;
      else byPayment.efectivo += o.total;
    });
    const totalDiscounts = filtered.reduce((s, o) => s + (o.discount || 0), 0);

    const itemCounts = {};
    const itemRevenue = {};
    filtered.forEach(order => {
      order.items.forEach(item => {
        if (!itemCounts[item.name]) { itemCounts[item.name] = 0; itemRevenue[item.name] = 0; }
        itemCounts[item.name] += item.qty;
        itemRevenue[item.name] += item.price * item.qty;
      });
    });

    const topByQty = Object.entries(itemCounts).map(([name, qty]) => ({ name, qty, revenue: itemRevenue[name] })).sort((a, b) => b.qty - a.qty);
    const topByRevenue = Object.entries(itemRevenue).map(([name, revenue]) => ({ name, revenue, qty: itemCounts[name] })).sort((a, b) => b.revenue - a.revenue);

    // Orders by hour (today only)
    const byHour = Array(24).fill(0);
    if (period === 'today') {
      filtered.forEach(o => { byHour[new Date(o.createdAt).getHours()]++; });
    }

    // Orders by day (week)
    const byDay = {};
    if (period === 'week' || period === 'month') {
      filtered.forEach(o => {
        const d = new Date(o.createdAt).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
        if (!byDay[d]) byDay[d] = { orders: 0, revenue: 0 };
        byDay[d].orders++;
        byDay[d].revenue += o.total;
      });
    }

    return { totalRevenue, totalOrders, avgTicket, topByQty, topByRevenue, byHour, byDay, byPayment, totalDiscounts };
  }, [filtered, period]);

  const maxQty = stats.topByQty[0]?.qty || 1;
  const maxRev = stats.topByRevenue[0]?.revenue || 1;

  const COLORS = ['#f5820d', '#f5c518', '#4caf50', '#3a86ff', '#e63946', '#8338ec'];

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
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: 'var(--orange)', lineHeight: 1 }}>
            📊 Estadísticas de Ventas
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['today','Hoy'],['week','Semana'],['month','Mes'],['all','Todo']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)} style={{
              padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: period === v ? 'var(--orange)' : 'var(--bg3)',
              color: period === v ? '#000' : 'var(--text2)',
              border: '1px solid var(--border)'
            }}>{l}</button>
          ))}
          <button onClick={handleExport} disabled={exporting || filtered.length === 0} style={{
            padding: '8px 18px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: exporting || filtered.length === 0 ? 'default' : 'pointer',
            background: exportDone ? '#4caf50' : '#1d6f42',
            color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6,
            opacity: filtered.length === 0 ? 0.5 : 1, transition: 'background 0.2s'
          }}>
            <span style={{ fontSize: 16 }}>{exportDone ? '✓' : '📊'}</span>
            {exportDone ? 'Descargado!' : exporting ? 'Generando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {/* Summary cards */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatCard label="Ventas totales" value={`$${stats.totalRevenue.toLocaleString('es-AR')}`} color="var(--yellow)" />
          <StatCard label="Pedidos" value={stats.totalOrders} sub="confirmados" color="var(--orange)" />
          <StatCard label="Ticket promedio" value={`$${stats.avgTicket.toLocaleString('es-AR')}`} sub="por pedido" color="#4caf50" />
          {stats.totalDiscounts > 0 && (
            <StatCard label="Descuentos aplicados" value={`$${stats.totalDiscounts.toLocaleString('es-AR')}`} sub="total descontado" color="var(--red)" />
          )}
        </div>

        {/* Caja por método de pago */}
        <div style={{ background: 'var(--bg2)', borderRadius: 18, padding: '1.25rem 1.5rem', border: '1px solid var(--border)', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#4caf50', marginBottom: 14 }}>
            💰 Resumen de Caja
          </h3>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { id: 'efectivo', label: 'Efectivo', icon: '💵', color: '#4caf50' },
              { id: 'tarjeta', label: 'Tarjeta', icon: '💳', color: '#3a86ff' },
              { id: 'transferencia', label: 'Transferencia', icon: '📱', color: '#f5c518' },
            ].map(({ id, label, icon, color }) => (
              <div key={id} style={{
                flex: 1, minWidth: 130, background: 'var(--bg3)', borderRadius: 14,
                padding: '1rem', border: `1px solid ${color}33`
              }}>
                <p style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  {icon} {label}
                </p>
                <p style={{ fontFamily: 'Bebas Neue', fontSize: 28, color, lineHeight: 1 }}>
                  ${(stats.byPayment?.[id] || 0).toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Top by quantity */}
          <div style={{ background: 'var(--bg2)', borderRadius: 18, padding: '1.5rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--orange)', marginBottom: 16 }}>
              🏆 Más Pedidos (cantidad)
            </h3>
            {stats.topByQty.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>Sin datos en este período</p>
            ) : stats.topByQty.slice(0, 8).map((item, i) => (
              <Bar key={item.name} label={item.name} value={item.qty} max={maxQty} color={COLORS[i % COLORS.length]} />
            ))}
          </div>

          {/* Top by revenue */}
          <div style={{ background: 'var(--bg2)', borderRadius: 18, padding: '1.5rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--yellow)', marginBottom: 16 }}>
              💰 Más Facturado ($)
            </h3>
            {stats.topByRevenue.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>Sin datos en este período</p>
            ) : stats.topByRevenue.slice(0, 8).map((item, i) => (
              <Bar key={item.name} label={item.name} value={`$${Math.round(item.revenue / 1000)}k`} max={maxRev} color={COLORS[i % COLORS.length]} />
            ))}
          </div>

          {/* Hourly distribution - today */}
          {period === 'today' && (
            <div style={{ background: 'var(--bg2)', borderRadius: 18, padding: '1.5rem', border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
              <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#4caf50', marginBottom: 16 }}>
                🕐 Pedidos por hora (hoy)
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                {stats.byHour.map((count, h) => {
                  const maxH = Math.max(...stats.byHour, 1);
                  const pct = (count / maxH) * 100;
                  return (
                    <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%', height: `${pct}%`, minHeight: count > 0 ? 4 : 0,
                        background: count > 0 ? '#4caf50' : 'var(--bg4)',
                        borderRadius: '4px 4px 0 0', transition: 'height 0.4s'
                      }} />
                      {(h % 3 === 0) && (
                        <span style={{ fontSize: 9, color: 'var(--text2)' }}>{h}hs</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily breakdown */}
          {(period === 'week' || period === 'month') && Object.keys(stats.byDay).length > 0 && (
            <div style={{ background: 'var(--bg2)', borderRadius: 18, padding: '1.5rem', border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
              <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#3a86ff', marginBottom: 16 }}>
                📅 Desglose por día
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Día','Pedidos','Total'].map(h => (
                        <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.byDay).reverse().map(([day, data]) => (
                      <tr key={day} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 700 }}>{day}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--orange)' }}>{data.orders} pedidos</td>
                        <td style={{ padding: '10px 16px', color: 'var(--yellow)', fontFamily: 'Bebas Neue', fontSize: 18 }}>
                          ${data.revenue.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
