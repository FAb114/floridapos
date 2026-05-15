const isElectron = () => typeof window !== 'undefined' && window.electronAPI?.isElectron;

const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

export function buildTicketHTML(order) {
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('es-AR');
  const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const lines = order.items.map(item => {
    const itemRow = `<tr>
      <td class="item-name">${item.qty}x ${item.name}</td>
      <td class="item-price">$${(item.price * item.qty).toLocaleString('es-AR')}</td>
    </tr>`;
    const noteRow = item.itemNote
      ? `<tr><td colspan="2" class="item-note">→ ${item.itemNote}</td></tr>`
      : '';
    return itemRow + noteRow;
  }).join('');

  const discountRow = order.discount > 0 ? `
    <tr>
      <td class="item-name" style="font-size:11px;color:#555;">Subtotal</td>
      <td class="item-price" style="font-size:11px;color:#555;">$${(order.subtotal || order.total + order.discount).toLocaleString('es-AR')}</td>
    </tr>
    <tr>
      <td class="item-name" style="font-size:11px;color:#555;">Descuento</td>
      <td class="item-price" style="font-size:11px;color:#555;">-$${order.discount.toLocaleString('es-AR')}</td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:76mm;margin:0;padding:0;}
  body{font-family:'Courier New',monospace;font-size:13px;color:#000;background:#fff;padding:8px 6px;height:auto;display:block;}
  .logo{text-align:center;font-size:16px;font-weight:900;letter-spacing:1px;margin-bottom:2px;}
  .phone{text-align:center;font-size:11px;margin-bottom:6px;}
  .divider{border:none;border-top:1px dashed #000;margin:5px 0;}
  .meta{display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;}
  .order-num{font-weight:700;font-size:13px;}
  .table-num{font-weight:700;font-size:12px;margin-bottom:2px;}
  .payment{font-size:11px;margin-bottom:2px;}
  table{width:100%;border-collapse:collapse;}
  .item-name{padding:3px 0;font-size:12px;}
  .item-price{text-align:right;padding:3px 0;font-size:12px;white-space:nowrap;}
  .item-note{font-size:10px;font-style:italic;color:#555;padding-bottom:3px;}
  .note{font-size:11px;font-style:italic;margin:4px 0;}
  .total-row td{font-size:15px;font-weight:900;padding-top:5px;}
  .footer{text-align:center;font-size:11px;margin-top:6px;line-height:1.6;}
  @media print{@page{margin:2mm;size:80mm auto;}body{width:72mm;}}
</style></head><body>
  <div class="logo">** FLORIDA BURGERS **</div>
  <div class="phone">Tel: 3487 681888</div>
  <hr class="divider">
  <div class="meta">
    <span class="order-num">Pedido #${order.number}</span>
    <span>${dateStr} ${timeStr}</span>
  </div>
  ${order.tableNumber ? `<div class="table-num">Mesa: ${order.tableNumber}</div>` : ''}
  ${order.paymentMethod ? `<div class="payment">Pago: ${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</div>` : ''}
  <hr class="divider">
  <table><tbody>${lines}</tbody></table>
  <hr class="divider">
  ${order.note ? `<div class="note">Nota: ${order.note}</div>` : ''}
  <table><tbody>
    ${discountRow}
    <tr class="total-row">
      <td class="item-name">TOTAL</td>
      <td class="item-price">$${order.total.toLocaleString('es-AR')}</td>
    </tr>
  </tbody></table>
  <hr class="divider">
  <div class="footer">¡Gracias por su pedido!<br>Todos los combos incluyen papas</div>
</body></html>`;
}

export async function printTicketDirect(order) {
  const html = buildTicketHTML(order);
  if (isElectron()) {
    return await window.electronAPI.print.ticket(html);
  }
  const win = window.open('', '_blank', 'width=380,height=680');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

export async function downloadTicketPDF(order) {
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('es-AR').replace(/\//g, '-');
  const fileName = `ticket-${order.number}-${dateStr}.pdf`;
  const html = buildTicketHTML(order);

  if (isElectron()) {
    // Devuelve { success, filePath } — el componente maneja la apertura
    return await window.electronAPI.savePDF(html, fileName);
  }

  // Fallback para navegador (dev): Blob + iframe oculto
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;opacity:0;';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 2000);
    }, 300);
  };
  return { success: true, filePath: null };
}
