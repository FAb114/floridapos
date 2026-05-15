import React, { useState, useRef } from 'react';

const COLOR_OPTIONS = ['#f5820d', '#e63946', '#f5c518', '#1d9e75', '#3a86ff', '#8338ec', '#ff006e', '#06d6a0'];
const ICON_OPTIONS = ['🍔', '🌭', '🍟', '🥤', '🍮', '🍕', '🥗', '🧁', '☕', '🍺', '🥩', '🌮'];

function PinChangePanel({ getPin }) {
  const [current, setCurrent] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState(null);

  const handleSave = () => {
    if (current !== getPin()) { setMsg({ type: 'error', text: 'PIN actual incorrecto' }); return; }
    if (newPin.length < 4) { setMsg({ type: 'error', text: 'Mínimo 4 dígitos' }); return; }
    if (newPin !== confirm) { setMsg({ type: 'error', text: 'Los PINs no coinciden' }); return; }
    localStorage.setItem('florida_pin', newPin);
    setMsg({ type: 'ok', text: '✓ PIN actualizado' });
    setCurrent(''); setNewPin(''); setConfirm('');
    setTimeout(() => setMsg(null), 3000);
  };

  const iStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'var(--bg4)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 15, outline: 'none', letterSpacing: 4, textAlign: 'center', marginTop: 4
  };

  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 16, padding: '1.5rem', border: '1px solid var(--border)', maxWidth: 400 }}>
      <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--orange)', marginBottom: 16 }}>🔐 Cambiar PIN de Acceso</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[['PIN Actual', current, setCurrent], ['Nuevo PIN', newPin, setNewPin], ['Confirmar Nuevo PIN', confirm, setConfirm]].map(([label, val, setter]) => (
          <div key={label}>
            <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
            <input type="password" value={val} onChange={e => setter(e.target.value)} maxLength={8} style={iStyle} placeholder="••••" />
          </div>
        ))}
        {msg && <p style={{ fontSize: 13, fontWeight: 700, color: msg.type === 'ok' ? '#4caf50' : 'var(--red)' }}>{msg.text}</p>}
        <button onClick={handleSave} style={{
          padding: '12px', borderRadius: 12, background: 'var(--orange)',
          color: '#000', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer'
        }}>Guardar PIN</button>
      </div>
    </div>
  );
}

function ImageUploader({ value, onChange, size = 80 }) {
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        onClick={() => inputRef.current.click()}
        style={{
          width: size, height: size, borderRadius: 12,
          background: 'var(--bg4)', border: '2px dashed var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden', flexShrink: 0, transition: 'border-color 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--orange)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        {value ? (
          <img src={value} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 24, opacity: 0.4 }}>📷</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => inputRef.current.click()} style={{
          padding: '7px 14px', borderRadius: 8, background: 'var(--bg4)',
          color: 'var(--text)', fontSize: 13, fontWeight: 700, border: '1px solid var(--border)', cursor: 'pointer'
        }}>{value ? 'Cambiar foto' : 'Subir foto'}</button>
        {value && (
          <button onClick={() => onChange(null)} style={{
            padding: '7px 14px', borderRadius: 8, background: 'transparent',
            color: 'var(--red)', fontSize: 12, fontWeight: 700, border: '1px solid var(--red)', cursor: 'pointer'
          }}>Quitar foto</button>
        )}
      </div>
    </div>
  );
}

function ProductEditor({ item, onSave, onDelete, categoryColor }) {
  const [form, setForm] = useState({ ...item });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div style={{
      background: 'var(--bg3)', borderRadius: 16, padding: '1.25rem',
      border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <ImageUploader value={form.image} onChange={v => set('image', v)} size={90} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Nombre del producto"
            style={{ ...inputStyle, fontWeight: 700, fontSize: 15 }}
          />
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Descripción (ingredientes, etc.)"
            rows={2}
            style={{ ...inputStyle, resize: 'none', fontSize: 12 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 100 }}>
          <label style={labelStyle}>Precio ($)</label>
          <input
            type="number"
            value={form.price}
            onChange={e => set('price', +e.target.value)}
            style={{ ...inputStyle }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
          <input
            type="checkbox"
            id={`dbl-${item.id}`}
            checked={form.hasDouble}
            onChange={e => set('hasDouble', e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor={`dbl-${item.id}`} style={{ fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>
            Tiene versión Doble
          </label>
        </div>
        {form.hasDouble && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 100 }}>
            <label style={labelStyle}>Precio Doble ($)</label>
            <input
              type="number"
              value={form.doublePrice || ''}
              onChange={e => set('doublePrice', +e.target.value)}
              style={{ ...inputStyle }}
            />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
          <input
            type="checkbox"
            id={`tpl-${item.id}`}
            checked={form.hasTriple || false}
            onChange={e => set('hasTriple', e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor={`tpl-${item.id}`} style={{ fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>
            Tiene versión Triple
          </label>
        </div>
        {form.hasTriple && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 100 }}>
            <label style={{ ...labelStyle, color: '#c0392b' }}>Precio Triple ($)</label>
            <input
              type="number"
              value={form.triplePrice || ''}
              onChange={e => set('triplePrice', +e.target.value)}
              style={{ ...inputStyle, borderColor: '#c0392b55' }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={() => onDelete(item.id)} style={{
          padding: '8px 16px', borderRadius: 10, background: 'transparent',
          color: 'var(--red)', fontWeight: 700, fontSize: 13,
          border: '1px solid var(--red)', cursor: 'pointer'
        }}>Eliminar</button>
        <button onClick={() => onSave(form)} style={{
          padding: '8px 20px', borderRadius: 10,
          background: categoryColor, color: '#000',
          fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer'
        }}>Guardar</button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 10,
  background: 'var(--bg4)', border: '1px solid var(--border)',
  color: 'var(--text)', fontSize: 14, outline: 'none'
};
const labelStyle = { fontSize: 11, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 };


function ElectronSettings() {
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
  const [settings, setSettings] = React.useState({ kioskMode: false, printerName: '', autoLaunch: false });
  const [appInfo, setAppInfo] = React.useState(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (!isElectron) return;
    Promise.all([
      window.electronAPI.settings.get(),
      window.electronAPI.appInfo(),
      window.electronAPI.autoLaunch.get(),
    ]).then(([s, info, autoLaunch]) => {
      setSettings({ ...s, autoLaunch });
      setAppInfo(info);
    });
  }, []);

  const save = async () => {
    if (!isElectron) return;
    await window.electronAPI.settings.set(settings);
    await window.electronAPI.autoLaunch.set(settings.autoLaunch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isElectron) {
    return (
      <div style={{ background: 'var(--bg4)', borderRadius: 12, padding: '1rem', border: '1px dashed var(--border)', marginTop: 16, maxWidth: 400 }}>
        <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
          ⚡ Las opciones de escritorio están disponibles en la app instalada (Electron)
        </p>
      </div>
    );
  }

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
  const iStyle = { width: '100%', padding: '8px 12px', borderRadius: 10, background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none', marginTop: 4 };

  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 16, padding: '1.5rem', border: '1px solid var(--border)', maxWidth: 400, marginTop: 20 }}>
      <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 22, color: '#3a86ff', marginBottom: 16 }}>🖥️ Opciones de Escritorio</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Kiosco */}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>🔒 Modo Kiosco</p>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Pantalla completa sin barra, bloquea Alt+F4</p>
          </div>
          <div onClick={() => toggle('kioskMode')} style={{
            width: 44, height: 24, borderRadius: 12, background: settings.kioskMode ? 'var(--orange)' : 'var(--bg4)',
            border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
          }}>
            <div style={{
              position: 'absolute', top: 2, left: settings.kioskMode ? 22 : 2, width: 18, height: 18,
              borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
            }} />
          </div>
        </label>

        {/* Autoarranque */}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>🚀 Autoarranque</p>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Iniciar al encender la PC automáticamente</p>
          </div>
          <div onClick={() => toggle('autoLaunch')} style={{
            width: 44, height: 24, borderRadius: 12, background: settings.autoLaunch ? 'var(--orange)' : 'var(--bg4)',
            border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0
          }}>
            <div style={{
              position: 'absolute', top: 2, left: settings.autoLaunch ? 22 : 2, width: 18, height: 18,
              borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
            }} />
          </div>
        </label>

        {/* Impresora */}
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🖨️ Nombre de impresora</p>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Dejá vacío para usar la impresora por defecto</p>
          <input
            value={settings.printerName}
            onChange={e => setSettings(s => ({ ...s, printerName: e.target.value }))}
            placeholder="Ej: POS-80, EPSON TM-T20..."
            style={iStyle}
          />
        </div>

        <button onClick={save} style={{
          padding: '11px', borderRadius: 12, background: saved ? '#4caf50' : 'var(--orange)',
          color: '#000', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'background 0.2s'
        }}>{saved ? '✓ Guardado' : 'Aplicar cambios'}</button>

        {appInfo && (
          <button onClick={() => window.electronAPI.openDataFolder()} style={{
            padding: '8px', borderRadius: 10, background: 'transparent',
            border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer'
          }}>📁 Abrir carpeta de datos (backups)</button>
        )}
      </div>
    </div>
  );
}

export default function ConfigView({ menu, setMenu, onBack, getPin }) {
  const [activeCat, setActiveCat] = useState(menu.categories[0]?.id);
  const [sidebarView, setSidebarView] = useState("menu"); // "menu" | "system"
  const [expandedItem, setExpandedItem] = useState(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ name: '', icon: '🍔', color: '#f5820d' });
  const [saved, setSaved] = useState(false);

  const currentCat = menu.categories.find(c => c.id === activeCat);

  const updateItem = (catId, updatedItem) => {
    setMenu(m => ({
      ...m,
      categories: m.categories.map(cat =>
        cat.id === catId
          ? { ...cat, items: cat.items.map(i => i.id === updatedItem.id ? updatedItem : i) }
          : cat
      )
    }));
    setExpandedItem(null);
    flashSaved();
  };

  const deleteItem = (catId, itemId) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setMenu(m => ({
      ...m,
      categories: m.categories.map(cat =>
        cat.id === catId ? { ...cat, items: cat.items.filter(i => i.id !== itemId) } : cat
      )
    }));
  };

  const addProduct = () => {
    const id = `item-${Date.now()}`;
    const newItem = { id, name: 'Nuevo Producto', price: 0, description: '', image: null, hasDouble: false };
    setMenu(m => ({
      ...m,
      categories: m.categories.map(cat =>
        cat.id === activeCat ? { ...cat, items: [...cat.items, newItem] } : cat
      )
    }));
    setExpandedItem(id);
    setShowNewProduct(false);
    flashSaved();
  };

  const addCategory = () => {
    if (!newCatForm.name.trim()) return;
    const id = `cat-${Date.now()}`;
    setMenu(m => ({
      ...m,
      categories: [...m.categories, { id, ...newCatForm, items: [] }]
    }));
    setActiveCat(id);
    setShowNewCategory(false);
    setNewCatForm({ name: '', icon: '🍔', color: '#f5820d' });
    flashSaved();
  };

  const deleteCategory = (catId) => {
    if (!confirm('¿Eliminar esta categoría y todos sus productos?')) return;
    setMenu(m => ({
      ...m,
      categories: m.categories.filter(c => c.id !== catId)
    }));
    setActiveCat(menu.categories[0]?.id);
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{
        width: 260, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
            color: 'var(--text2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', marginBottom: 12
          }}>← Volver al POS</button>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: 'var(--orange)' }}>⚙️ Configuración</h1>
          <p style={{ fontSize: 12, color: 'var(--text2)' }}>Gestión de menú y productos</p>
        </div>

        <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '0 10px', marginBottom: 8 }}>
            Categorías
          </p>
          {menu.categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)} style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              background: activeCat === cat.id ? cat.color + '22' : 'transparent',
              border: activeCat === cat.id ? `1px solid ${cat.color}55` : '1px solid transparent',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              marginBottom: 4, transition: 'all 0.15s'
            }}>
              <span style={{ fontSize: 20 }}>{cat.icon}</span>
              <span style={{
                flex: 1, textAlign: 'left', fontWeight: 700, fontSize: 14,
                color: activeCat === cat.id ? cat.color : 'var(--text)'
              }}>{cat.name}</span>
              <span style={{
                fontSize: 11, color: 'var(--text2)', background: 'var(--bg4)',
                borderRadius: 6, padding: '2px 6px'
              }}>{cat.items.length}</span>
            </button>
          ))}

          <button onClick={() => setShowNewCategory(true)} style={{
            width: '100%', marginTop: 8, padding: '10px', borderRadius: 12,
            background: 'transparent', border: '1px dashed var(--border)',
            color: 'var(--text2)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}>+ Nueva categoría</button>

          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <p style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '0 10px', marginBottom: 8 }}>Sistema</p>
            <button onClick={() => setSidebarView(sidebarView === 'system' ? 'menu' : 'system')} style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              background: sidebarView === 'system' ? '#3a86ff22' : 'transparent',
              border: sidebarView === 'system' ? '1px solid #3a86ff55' : '1px solid transparent',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              color: sidebarView === 'system' ? '#3a86ff' : 'var(--text2)',
              fontWeight: 700, fontSize: 14
            }}>
              <span style={{ fontSize: 18 }}>&#x1F510;</span> PIN &amp; Sistema
            </button>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: saved ? '#4caf50' : 'var(--text2)', fontWeight: 700, transition: 'color 0.3s' }}>
            {saved ? '✓ Guardado automáticamente' : '💾 Guardado automático activo'}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {sidebarView === 'system' ? (
          <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '32px 40px', background: 'var(--bg2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <span style={{ fontSize: 28 }}>🔐</span>
              <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: '#3a86ff', lineHeight: 1 }}>PIN &amp; Sistema</h2>
            </div>
            <PinChangePanel getPin={getPin} />
            <ElectronSettings />
            <div style={{ marginTop: 24, background: 'var(--bg3)', borderRadius: 16, padding: '1.5rem', border: '1px solid var(--border)', maxWidth: 400 }}>
              <h3 style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: 'var(--text2)', marginBottom: 12 }}>ℹ️ Info del sistema</h3>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 2.2 }}>
                <strong style={{ color: 'var(--text)' }}>Versión:</strong> 3.0.0<br/>
                <strong style={{ color: 'var(--text)' }}>Categorías:</strong> {menu.categories.length}<br/>
                <strong style={{ color: 'var(--text)' }}>Productos:</strong> {menu.categories.reduce((s,c)=>s+c.items.length,0)}<br/>
                <strong style={{ color: 'var(--text)' }}>Modo kiosco:</strong> F11 en pantalla POS<br/>
                <strong style={{ color: 'var(--text)' }}>Almacenamiento:</strong> Navegador (localStorage)
              </p>
            </div>
          </div>
        ) : currentCat ? (
          <>
            <div style={{
              padding: '16px 28px', borderBottom: '1px solid var(--border)',
              background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 12
            }}>
              <span style={{ fontSize: 28 }}>{currentCat.icon}</span>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: currentCat.color, lineHeight: 1 }}>
                  {currentCat.name}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>{currentCat.items.length} productos</p>
              </div>
              <button onClick={() => deleteCategory(currentCat.id)} style={{
                padding: '8px 14px', borderRadius: 10, background: 'transparent',
                color: 'var(--red)', fontWeight: 700, fontSize: 12,
                border: '1px solid var(--red)', cursor: 'pointer'
              }}>Eliminar categoría</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700 }}>
                {currentCat.items.map(item => (
                  <div key={item.id}>
                    {expandedItem === item.id ? (
                      <ProductEditor
                        item={item}
                        categoryColor={currentCat.color}
                        onSave={updated => updateItem(currentCat.id, updated)}
                        onDelete={id => deleteItem(currentCat.id, id)}
                      />
                    ) : (
                      <div
                        onClick={() => setExpandedItem(item.id)}
                        style={{
                          background: 'var(--bg3)', borderRadius: 14, padding: '14px 18px',
                          border: '1px solid var(--border)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 14,
                          transition: 'border-color 0.15s'
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = currentCat.color}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={{
                            width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0
                          }} />
                        ) : (
                          <div style={{
                            width: 52, height: 52, borderRadius: 10, background: 'var(--bg4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0
                          }}>📷</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{item.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || 'Sin descripción'}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: currentCat.color }}>
                            ${item.price.toLocaleString('es-AR')}
                          </p>
                          {item.hasDouble && (
                            <p style={{ fontSize: 11, color: 'var(--text2)' }}>
                              Doble: ${(item.doublePrice || 0).toLocaleString('es-AR')}
                            </p>
                          )}
                        </div>
                        <span style={{ color: 'var(--text2)', fontSize: 18 }}>›</span>
                      </div>
                    )}
                  </div>
                ))}

                <button onClick={addProduct} style={{
                  padding: '14px', borderRadius: 14, background: 'transparent',
                  border: `2px dashed ${currentCat.color}66`,
                  color: currentCat.color, fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = currentCat.color + '11'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  + Agregar producto a {currentCat.name}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text2)' }}>Seleccioná una categoría</p>
          </div>
        )}
      </div>

      {/* New Category Modal */}
      {showNewCategory && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg2)', borderRadius: 24, padding: '2rem',
            border: '1px solid var(--border)', minWidth: 360
          }}>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: 'var(--orange)', marginBottom: 20 }}>
              Nueva Categoría
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  value={newCatForm.name}
                  onChange={e => setNewCatForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Wraps, Ensaladas..."
                  style={{ ...inputStyle, marginTop: 4 }}
                  autoFocus
                />
              </div>
              <div>
                <label style={labelStyle}>Ícono</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {ICON_OPTIONS.map(ic => (
                    <button key={ic} onClick={() => setNewCatForm(f => ({ ...f, icon: ic }))} style={{
                      width: 40, height: 40, borderRadius: 10, fontSize: 20,
                      background: newCatForm.icon === ic ? 'var(--orange)' : 'var(--bg4)',
                      border: newCatForm.icon === ic ? '2px solid var(--orange)' : '1px solid var(--border)',
                      cursor: 'pointer'
                    }}>{ic}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setNewCatForm(f => ({ ...f, color: c }))} style={{
                      width: 36, height: 36, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
                      outline: newCatForm.color === c ? `3px solid white` : 'none',
                      outlineOffset: 2
                    }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowNewCategory(false)} style={{
                flex: 1, padding: '12px', borderRadius: 12, background: 'var(--bg4)',
                color: 'var(--text2)', fontWeight: 700, fontSize: 14, border: '1px solid var(--border)', cursor: 'pointer'
              }}>Cancelar</button>
              <button onClick={addCategory} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: newCatForm.color, color: '#000',
                fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer'
              }}>Crear categoría</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
