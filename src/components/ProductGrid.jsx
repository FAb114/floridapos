import { useState } from 'react';

function ProductCard({ item, categoryColor, onAdd }) {
  const [pressed, setPressed] = useState(false);
  const [showVariant, setShowVariant] = useState(false);

  const handleClick = () => {
    if (item.hasDouble || item.hasTriple) {
      setShowVariant(true);
    } else {
      triggerAdd('simple');
    }
  };

  const triggerAdd = (variant) => {
    setPressed(true);
    setShowVariant(false);
    onAdd(item, variant);
    setTimeout(() => setPressed(false), 300);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleClick}
        style={{
          width: '100%', background: 'var(--bg3)', borderRadius: 18,
          border: `2px solid ${pressed ? categoryColor : 'var(--border)'}`,
          overflow: 'hidden', cursor: 'pointer', transition: 'all 0.18s',
          transform: pressed ? 'scale(0.96)' : 'scale(1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: pressed ? `0 0 20px ${categoryColor}44` : 'none'
        }}
      >
        {/* Image area */}
        <div style={{
          width: '100%', aspectRatio: '4/3', background: 'var(--bg4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden'
        }}>
          {item.image ? (
            <img src={item.image} alt={item.name} style={{
              width: '100%', height: '100%', objectFit: 'cover'
            }} />
          ) : (
            <div style={{ fontSize: 52, opacity: 0.5 }}>
              {item.id.includes('agua') || item.id.includes('gaseosa') || item.id.includes('cerveza') ? '🥤' :
               item.id.includes('flan') || item.id.includes('copa') || item.id.includes('brownie') ? '🍮' :
               item.id.includes('papas') ? '🍟' :
               item.id.includes('bacon-ch') || item.id.includes('calabresa') ? '🌭' : '🍔'}
            </div>
          )}
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: categoryColor, borderRadius: 8,
            padding: '3px 8px', fontSize: 11, fontWeight: 800, color: '#000'
          }}>
            ${item.price.toLocaleString('es-AR')}
          </div>
          {(item.hasDouble || item.hasTriple) && (
            <div style={{
              position: 'absolute', top: 8, left: 8,
              background: 'rgba(0,0,0,0.7)', borderRadius: 8,
              padding: '3px 7px', fontSize: 10, fontWeight: 700, color: '#f5c518'
            }}>
              {item.hasTriple ? '+ DOBLE/TRIPLE' : '+ DOBLE'}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px 14px', textAlign: 'left', flex: 1 }}>
          <h3 style={{
            fontFamily: 'Bebas Neue', fontSize: 20, color: 'var(--text)',
            letterSpacing: 0.5, marginBottom: 4, lineHeight: 1
          }}>{item.name}</h3>
          <p style={{
            fontSize: 11, color: 'var(--text2)', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>{item.description}</p>
        </div>

        {/* Add button */}
        <div style={{
          margin: '0 14px 14px', padding: '10px',
          background: pressed ? categoryColor : 'rgba(255,255,255,0.07)',
          borderRadius: 10, fontWeight: 800, fontSize: 14,
          color: pressed ? '#000' : categoryColor,
          transition: 'all 0.18s', textAlign: 'center'
        }}>
          {pressed ? '¡Agregado! ✓' : '+ Agregar al pedido'}
        </div>
      </button>

      {/* Variant selector modal */}
      {showVariant && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowVariant(false)}>
          <div style={{
            background: 'var(--bg2)', borderRadius: 24, padding: '2rem',
            border: `2px solid ${categoryColor}`, minWidth: 320, maxWidth: 400
          }} onClick={e => e.stopPropagation()}>
            {item.image && (
              <img src={item.image} alt={item.name} style={{
                width: '100%', height: 160, objectFit: 'cover',
                borderRadius: 14, marginBottom: 16
              }} />
            )}
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 34, color: categoryColor, marginBottom: 4 }}>
              {item.name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>{item.description}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
              Elegí tu variante
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Simple */}
              <button onClick={() => triggerAdd('simple')} style={{
                flex: 1, minWidth: 90, padding: '14px 10px', borderRadius: 14, fontWeight: 800,
                background: 'var(--bg3)', color: 'var(--text)',
                border: `2px solid ${categoryColor}`, cursor: 'pointer'
              }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: categoryColor }}>Simple</div>
                <div style={{ fontSize: 16, color: 'var(--yellow)', marginTop: 4, fontWeight: 900 }}>
                  ${item.price.toLocaleString('es-AR')}
                </div>
              </button>
              {/* Doble */}
              {item.hasDouble && (
                <button onClick={() => triggerAdd('doble')} style={{
                  flex: 1, minWidth: 90, padding: '14px 10px', borderRadius: 14, fontWeight: 800,
                  background: categoryColor, color: '#000',
                  border: `2px solid ${categoryColor}`, cursor: 'pointer'
                }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 20 }}>Doble</div>
                  <div style={{ fontSize: 16, marginTop: 4, fontWeight: 900 }}>
                    ${(item.doublePrice || 0).toLocaleString('es-AR')}
                  </div>
                </button>
              )}
              {/* Triple */}
              {item.hasTriple && (
                <button onClick={() => triggerAdd('triple')} style={{
                  flex: 1, minWidth: 90, padding: '14px 10px', borderRadius: 14, fontWeight: 800,
                  background: '#c0392b', color: '#fff',
                  border: '2px solid #c0392b', cursor: 'pointer'
                }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 20 }}>Triple</div>
                  <div style={{ fontSize: 16, marginTop: 4, fontWeight: 900 }}>
                    ${(item.triplePrice || 0).toLocaleString('es-AR')}
                  </div>
                </button>
              )}
            </div>
            <button onClick={() => setShowVariant(false)} style={{
              width: '100%', marginTop: 12, padding: '10px',
              borderRadius: 10, background: 'transparent', color: 'var(--text2)',
              fontSize: 13, cursor: 'pointer', border: '1px solid var(--border)'
            }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductGrid({ items, categoryColor, onAdd }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 16
    }}>
      {items.map(item => (
        <ProductCard
          key={item.id}
          item={item}
          categoryColor={categoryColor}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}
