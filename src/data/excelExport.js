import * as XLSX from 'xlsx';

const isElectron = () => typeof window !== 'undefined' && window.electronAPI?.isElectron;

/**
 * Genera y descarga/guarda un Excel completo con estadísticas de ventas
 * Hojas: Resumen, Pedidos detallados, Por producto, Por día
 */
export async function exportStatsToExcel(orders, periodLabel = 'Exportación') {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Resumen ────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const avgTicket = orders.length ? Math.round(totalRevenue / orders.length) : 0;

  // Producto más vendido
  const itemCounts = {};
  orders.forEach(o => o.items.forEach(i => {
    itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
  }));
  const topProduct = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

  const summaryData = [
    ['🔥 FLORIDA BURGERS POS — Reporte de Ventas'],
    [''],
    ['Período', periodLabel],
    ['Fecha de exportación', new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })],
    [''],
    ['RESUMEN GENERAL', ''],
    ['Total de pedidos', orders.length],
    ['Total facturado', totalRevenue],
    ['Ticket promedio', avgTicket],
    ['Producto más vendido', topProduct ? `${topProduct[0]} (${topProduct[1]} unidades)` : '—'],
    [''],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

  // Estilos de ancho de columna
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 40 }];

  // Merge título
  wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // ── Hoja 2: Todos los pedidos ──────────────────────────────────────────────
  const PAYMENT_LABELS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' };
  const ordersHeader = ['N° Pedido', 'Fecha', 'Hora', 'Mesa/N°', 'Productos', 'Cant. Items', 'Descuento ($)', 'Total ($)', 'Pago', 'Nota'];
  const ordersRows = orders.map(o => {
    const d = new Date(o.createdAt);
    return [
      o.number,
      d.toLocaleDateString('es-AR'),
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      o.tableNumber || '—',
      o.items.map(i => `${i.qty}x ${i.name}${i.itemNote ? ` (${i.itemNote})` : ''}`).join(', '),
      o.items.reduce((s, i) => s + i.qty, 0),
      o.discount || 0,
      o.total,
      PAYMENT_LABELS[o.paymentMethod] || 'Efectivo',
      o.note || '',
    ];
  });

  const wsOrders = XLSX.utils.aoa_to_sheet([ordersHeader, ...ordersRows]);
  wsOrders['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 14 },
    { wch: 50 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
  ];

  // Formato de moneda para columna Total
  const totalColLetter = 'G';
  for (let i = 2; i <= ordersRows.length + 1; i++) {
    const cell = wsOrders[`${totalColLetter}${i}`];
    if (cell) cell.z = '#,##0';
  }

  XLSX.utils.book_append_sheet(wb, wsOrders, 'Pedidos');

  // ── Hoja 3: Por producto ───────────────────────────────────────────────────
  const productMap = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      if (!productMap[item.name]) {
        productMap[item.name] = { qty: 0, revenue: 0 };
      }
      productMap[item.name].qty += item.qty;
      productMap[item.name].revenue += item.price * item.qty;
    });
  });

  const productHeader = ['Producto', 'Unidades vendidas', 'Facturación ($)', '% del total'];
  const productRows = Object.entries(productMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, data]) => [
      name,
      data.qty,
      data.revenue,
      totalRevenue > 0 ? parseFloat(((data.revenue / totalRevenue) * 100).toFixed(1)) : 0,
    ]);

  // Fila de totales
  const productTotalsRow = [
    'TOTAL',
    productRows.reduce((s, r) => s + r[1], 0),
    totalRevenue,
    100,
  ];

  const wsProducts = XLSX.utils.aoa_to_sheet([productHeader, ...productRows, [], productTotalsRow]);
  wsProducts['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];

  // Formato porcentaje columna D
  for (let i = 2; i <= productRows.length + 1; i++) {
    const cell = wsProducts[`D${i}`];
    if (cell) cell.z = '0.0"%"';
    const cellC = wsProducts[`C${i}`];
    if (cellC) cellC.z = '#,##0';
  }

  XLSX.utils.book_append_sheet(wb, wsProducts, 'Por Producto');

  // ── Hoja 4: Por día ────────────────────────────────────────────────────────
  const dayMap = {};
  orders.forEach(o => {
    const day = new Date(o.createdAt).toLocaleDateString('es-AR');
    if (!dayMap[day]) dayMap[day] = { orders: 0, revenue: 0, items: 0 };
    dayMap[day].orders++;
    dayMap[day].revenue += o.total;
    dayMap[day].items += o.items.reduce((s, i) => s + i.qty, 0);
  });

  const dayHeader = ['Fecha', 'Pedidos', 'Items vendidos', 'Facturación ($)', 'Ticket promedio ($)'];
  const dayRows = Object.entries(dayMap)
    .sort((a, b) => {
      const [da, ma, ya] = a[0].split('/').map(Number);
      const [db, mb, yb] = b[0].split('/').map(Number);
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    })
    .map(([day, data]) => [
      day,
      data.orders,
      data.items,
      data.revenue,
      data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
    ]);

  const dayTotals = [
    'TOTAL',
    dayRows.reduce((s, r) => s + r[1], 0),
    dayRows.reduce((s, r) => s + r[2], 0),
    totalRevenue,
    avgTicket,
  ];

  const wsDay = XLSX.utils.aoa_to_sheet([dayHeader, ...dayRows, [], dayTotals]);
  wsDay['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 20 }];

  for (let i = 2; i <= dayRows.length + 1; i++) {
    ['D', 'E'].forEach(col => {
      const cell = wsDay[`${col}${i}`];
      if (cell) cell.z = '#,##0';
    });
  }

  XLSX.utils.book_append_sheet(wb, wsDay, 'Por Día');

  // ── Generar archivo ────────────────────────────────────────────────────────
  const date = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
  const fileName = `florida-burgers-ventas-${date}.xlsx`;

  if (isElectron()) {
    // En Electron: guardar con diálogo nativo
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const result = await window.electronAPI.saveExcel(Array.from(wbout), fileName);
    return result;
  } else {
    // En web/browser: descarga directa
    XLSX.writeFile(wb, fileName);
    return { success: true };
  }
}
