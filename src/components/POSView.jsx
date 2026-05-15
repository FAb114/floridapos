import { useState, useEffect, useCallback } from 'react';
import Cart from './Cart.jsx';
import ProductGrid from './ProductGrid.jsx';
import { saveOrder } from '../data/orders.js';
import TicketPreview from './TicketPreview.jsx';

export default function POSView({ menu, onConfigClick, onHistoryClick, onStatsClick, onKitchenClick, nextOrderNumber }) {
  const [activeCategory, setActiveCategory] = useState(menu.categories[0]?.id);
  const [cart, setCart] = useState([]);
  const [orderNote, setOrderNote] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [kioskMode, setKioskMode] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showTableInput, setShowTableInput] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [discount, setDiscount] = useState(null);
  const [itemNotes, setItemNotes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const currentCategory = menu.categories.find(c => c.id === activeCategory) || menu.categories[0];

  // Búsqueda de productos
  const searchResults = searchQuery.trim().length > 0
    ? menu.categories.flatMap(cat =>
        cat.items
          .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(item => ({ ...item, _catColor: cat.color, _catName: cat.name }))
      )
    : null;

  // ── Atajos de teclado ──────────────────────────────────────────────────────
  const handleKey = useCallback((e) => {
    // No activar atajos si hay un input enfocado (excepto Escape)
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

    if (e.key === 'Escape') {
      setShowTableInput(false);
      setSearchQuery('');
      document.activeElement?.blur();
      return;
    }
    if (isInput) return;

    if (e.key === 'F11') { e.preventDefault(); toggleKiosk(); return; }
    if (e.key === 'Enter' && cart.length > 0 && !showTicketPreview) {
      e.preventDefault();
      const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const discountAmount = discount?.amount || 0;
      confirmOrder(totalPrice - discountAmount, discountAmount);
      return;
    }
    // F1–F8 para categorías
    if (e.key.startsWith('F') && !isNaN(e.key.slice(1))) {
      const idx = parseInt(e.key.slice(1)) - 1;
      if (idx >= 0 && idx < menu.categories.length) {
        e.preventDefault();
        setActiveCategory(menu.categories[idx].id);
      }
    }
    // / para enfocar búsqueda
    if (e.key === '/') {
      e.preventDefault();
      document.getElementById('pos-search')?.focus();
    }
  }, [cart, discount, showTicketPreview, menu.categories]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const toggleKiosk = () => {
    if (!kioskMode) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    setKioskMode(k => !k);
  };

  const addToCart = (item, variant) => {
    const key = `${item.id}-${variant}`;
    setCart(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      const price = variant === 'triple' ? item.triplePrice : variant === 'doble' ? item.doublePrice : item.price;
      const name = variant === 'triple' ? `${item.name} Triple` : variant === 'doble' ? `${item.name} Doble` : item.name;
      return [...prev, { key, id: item.id, name, price, qty: 1, variant }];
    });
  };

  const updateQty = (key, delta) => {
    setCart(prev => prev.map(i => i.key === key ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  };

  const clearCart = () => {
    setCart([]);
    setOrderNote('');
    setTableNumber('');
    setDiscount(null);
    setItemNotes({});
    setPaymentMethod('efectivo');
    setShowNoteInput(false);
    setShowTableInput(false);
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const confirmOrder = (finalTotal, discountAmount) => {
    // Enriquecer items con sus notas individuales
    const itemsWithNotes = cart.map(item => ({
      ...item,
      itemNote: itemNotes[item.key] || ''
    }));
    const order = {
      number: nextOrderNumber(),
      items: itemsWithNotes,
      total: finalTotal,
      subtotal: finalTotal + (discountAmount || 0),
      discount: discountAmount || 0,
      note: orderNote,
      tableNumber,
      paymentMethod,
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    };
    saveOrder(order);
    setLastOrder(order);
    setShowTicketPreview(true);
  };

  const handleTicketClose = () => {
    setShowTicketPreview(false);
    clearCart();
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Left Sidebar */}
      <div style={{
        width: 92, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 10, gap: 6, overflowY: 'auto', flexShrink: 0
      }}>
        <div style={{ marginBottom: 8, textAlign: 'center', padding: '6px 4px 10px', borderBottom: '1px solid var(--border)', width: '100%' }}>
          <div style={{ fontSize: 28 }}>🔥</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 11, color: 'var(--orange)', letterSpacing: 1 }}>FLORIDA</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 9, color: 'var(--text2)', letterSpacing: 1 }}>BURGERS</div>
        </div>

        {menu.categories.map((cat, idx) => (
          <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }} style={{
            width: 74, minHeight: 70, borderRadius: 14,
            background: activeCategory === cat.id && !searchQuery ? cat.color : 'var(--bg3)',
            border: `2px solid ${activeCategory === cat.id && !searchQuery ? cat.color : 'transparent'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 3, transition: 'all 0.15s',
            transform: activeCategory === cat.id && !searchQuery ? 'scale(1.05)' : 'scale(1)',
            cursor: 'pointer', position: 'relative'
          }}>
            <span style={{ fontSize: 22 }}>{cat.icon}</span>
            <span style={{
              fontSize: 8, fontWeight: 800, color: activeCategory === cat.id && !searchQuery ? '#000' : 'var(--text2)',
              textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center', lineHeight: 1.2, paddingInline: 3
            }}>{cat.name}</span>
            <span style={{
              position: 'absolute', top: 3, right: 3, fontSize: 7,
              color: 'var(--text2)', opacity: 0.5
            }}>F{idx + 1}</span>
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {[
          { icon: '⛶', label: kioskMode ? 'Salir' : 'Kiosco', action: toggleKiosk },
          { icon: '👨‍🍳', label: 'Cocina', action: onKitchenClick },
          { icon: '📋', label: 'Historial', action: onHistoryClick },
          { icon: '📊', label: 'Stats', action: onStatsClick },
          { icon: '⚙️', label: 'Config', action: onConfigClick },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} style={{
            width: 74, height: 58, borderRadius: 12, background: 'var(--bg3)',
            border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer',
            color: 'var(--text2)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
            marginBottom: btn.label === 'Config' ? 12 : 0, transition: 'background 0.15s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--bg4)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--bg3)'}
          >
            <span style={{ fontSize: 16 }}>{btn.icon}</span>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Center - Products */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header con búsqueda */}
        <div style={{
          padding: '10px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0
        }}>
          <div style={{
            width: 7, height: 30, borderRadius: 4,
            background: searchQuery ? 'var(--text2)' : (currentCategory?.color || 'var(--orange)'), flexShrink: 0
          }} />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 26, lineHeight: 1, color: searchQuery ? 'var(--text2)' : (currentCategory?.color || 'var(--orange)') }}>
              {searchQuery ? `Búsqueda: "${searchQuery}"` : currentCategory?.name || 'Menú'}
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>
              {searchQuery
                ? `${searchResults?.length || 0} resultado${searchResults?.length !== 1 ? 's' : ''}`
                : `${currentCategory?.items?.length || 0} productos · Presioná / para buscar`}
            </p>
          </div>

          {/* Barra de búsqueda */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, pointerEvents: 'none', opacity: 0.5
            }}>🔍</span>
            <input
              id="pos-search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Buscar producto... (/)"
              style={{
                padding: '7px 12px 7px 32px', borderRadius: 10, width: 210,
                background: 'var(--bg3)',
                border: `1px solid ${searchFocused ? 'var(--orange)' : 'var(--border)'}`,
                color: 'var(--text)', fontSize: 13, outline: 'none',
                transition: 'border-color 0.15s'
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', color: 'var(--text2)',
                fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: 0
              }}>✕</button>
            )}
          </div>

          {/* Mesa */}
          {tableNumber ? (
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0
            }} onClick={() => setShowTableInput(true)}>
              <span style={{ fontSize: 14 }}>🪑</span>
              <span style={{ fontWeight: 800, color: 'var(--yellow)', fontSize: 13 }}>{tableNumber}</span>
            </div>
          ) : (
            <button onClick={() => setShowTableInput(true)} style={{
              padding: '6px 12px', borderRadius: 10, background: 'var(--bg3)', flexShrink: 0,
              border: '1px dashed var(--border)', color: 'var(--text2)', fontSize: 12,
              fontWeight: 700, cursor: 'pointer'
            }}>🪑 Mesa</button>
          )}

          {totalItems > 0 && (
            <div style={{
              background: 'var(--orange)', borderRadius: 20, padding: '5px 12px',
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0
            }}>
              <span style={{ fontSize: 13 }}>🛒</span>
              <span style={{ fontWeight: 800, color: '#000', fontSize: 13 }}>{totalItems}</span>
            </div>
          )}
        </div>

        {/* Products scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {searchResults !== null ? (
            searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 12 }}>🔍</div>
                <p style={{ color: 'var(--text2)', fontSize: 15 }}>No se encontraron productos para "{searchQuery}"</p>
              </div>
            ) : (
              <ProductGrid
                items={searchResults}
                categoryColor="var(--orange)"
                onAdd={addToCart}
                isSearch
              />
            )
          ) : (
            currentCategory && (
              <ProductGrid
                items={currentCategory.items}
                categoryColor={currentCategory.color}
                onAdd={addToCart}
              />
            )
          )}
        </div>

        {/* Hint atajos */}
        <div style={{
          padding: '5px 20px', borderTop: '1px solid var(--border)',
          background: 'var(--bg2)', display: 'flex', gap: 14, flexShrink: 0
        }}>
          {[
            ['Enter', 'Confirmar pedido'],
            ['/', 'Buscar'],
            ['F1–F' + Math.min(menu.categories.length, 8), 'Categorías'],
            ['Esc', 'Cerrar / limpiar'],
          ].map(([key, label]) => (
            <span key={key} style={{ fontSize: 10, color: 'var(--text2)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <code style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '1px 5px', fontSize: 9, fontFamily: 'monospace'
              }}>{key}</code>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Cart */}
      <Cart
        cart={cart}
        onUpdate={updateQty}
        onClear={clearCart}
        onConfirm={confirmOrder}
        totalPrice={cart.reduce((s, i) => s + i.price * i.qty, 0)}
        orderNote={orderNote}
        setOrderNote={setOrderNote}
        tableNumber={tableNumber}
        showNoteInput={showNoteInput}
        setShowNoteInput={setShowNoteInput}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        discount={discount}
        setDiscount={setDiscount}
        itemNotes={itemNotes}
        setItemNotes={setItemNotes}
      />

      {/* Table Number Modal */}
      {showTableInput && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }} onClick={() => setShowTableInput(false)}>
          <div style={{
            background: 'var(--bg2)', borderRadius: 20, padding: '2rem',
            border: '1px solid var(--border)', width: 320, textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🪑</div>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 26, color: 'var(--yellow)', marginBottom: 16 }}>
              Mesa o Número de Pedido
            </h2>
            <input
              autoFocus
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setShowTableInput(false)}
              placeholder="Ej: Mesa 3, Mostrador, Juan..."
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12, boxSizing: 'border-box',
                background: 'var(--bg3)', border: '2px solid var(--border)',
                color: 'var(--text)', fontSize: 16, outline: 'none', textAlign: 'center',
                marginBottom: 16
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {tableNumber && (
                <button onClick={() => { setTableNumber(''); setShowTableInput(false); }} style={{
                  padding: '10px 16px', borderRadius: 10, background: 'transparent',
                  border: '1px solid var(--red)', color: 'var(--red)', fontWeight: 700, cursor: 'pointer', fontSize: 13
                }}>Quitar</button>
              )}
              <button onClick={() => setShowTableInput(false)} style={{
                flex: 1, padding: '12px', borderRadius: 12, background: 'var(--orange)',
                color: '#000', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer'
              }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Preview Modal */}
      {showTicketPreview && lastOrder && (
        <TicketPreview order={lastOrder} onClose={handleTicketClose} />
      )}
    </div>
  );
}
