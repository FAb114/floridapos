import { useState, useEffect } from 'react';
import POSView from './components/POSView.jsx';
import ConfigView from './components/ConfigView.jsx';
import HistoryView from './components/HistoryView.jsx';
import KitchenView from './components/KitchenView.jsx';
import StatsView from './components/StatsView.jsx';
import { loadMenu, saveMenu, defaultMenu } from './data/menu.js';
import { storageGet, storageSet } from './data/storage.js';

export default function App() {
  const [view, setView] = useState('pos');
  const [menu, setMenu] = useState(null); // null = loading
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinTarget, setPinTarget] = useState('config');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [orderCounter, setOrderCounter] = useState(0);
  const [appReady, setAppReady] = useState(false);

  const getPin = () => {
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      return localStorage.getItem('florida_pin') || '1234';
    }
    return localStorage.getItem('florida_pin') || '1234';
  };

  // Load everything async on mount
  useEffect(() => {
    async function init() {
      try {
        // Timeout de 5 segundos — si falla el storage, arranca igual con defaults
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        );
        const load = Promise.all([loadMenu(), storageGet('orderCounter')]);
        const [savedMenu, savedCounter] = await Promise.race([load, timeout]);
        setMenu(savedMenu || defaultMenu);
        setOrderCounter(savedCounter || 0);
      } catch (e) {
        console.warn('Init fallback to defaults:', e.message);
        setMenu(defaultMenu);
        setOrderCounter(0);
      }
      setAppReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (menu) saveMenu(menu);
  }, [menu]);

  useEffect(() => {
    if (appReady) storageSet('orderCounter', orderCounter);
  }, [orderCounter, appReady]);

  const nextOrderNumber = () => {
    const next = orderCounter + 1;
    setOrderCounter(next);
    return next;
  };

  const handleProtectedNav = (target) => {
    setPinTarget(target);
    setShowPinModal(true);
    setPinInput('');
    setPinError(false);
  };

  const handlePinKey = (k) => {
    if (k === '⌫') { setPinInput(p => p.slice(0, -1)); return; }
    if (pinInput.length < 6) setPinInput(p => p + k);
  };

  const handlePinSubmit = () => {
    if (pinInput === getPin()) {
      setShowPinModal(false);
      setView(pinTarget);
    } else {
      setPinError(true);
      setTimeout(() => { setPinError(false); setPinInput(''); }, 1200);
    }
  };

  // Loading screen
  if (!appReady) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20
      }}>
        <div style={{ fontSize: 64 }}>🔥</div>
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 42, color: 'var(--orange)', letterSpacing: 2 }}>
          Florida Burgers POS
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: '50%', background: 'var(--orange)',
              animation: `bounce 0.8s ease-in-out ${i*0.15}s infinite`,
            }} />
          ))}
        </div>
        <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-8px);opacity:1}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {view === 'pos' && (
        <POSView
          menu={menu}
          onConfigClick={() => handleProtectedNav('config')}
          onHistoryClick={() => handleProtectedNav('history')}
          onStatsClick={() => handleProtectedNav('stats')}
          onKitchenClick={() => handleProtectedNav('kitchen')}
          nextOrderNumber={nextOrderNumber}
        />
      )}
      {view === 'config' && (
        <ConfigView menu={menu} setMenu={setMenu} onBack={() => setView('pos')} getPin={getPin} />
      )}
      {view === 'history' && <HistoryView onBack={() => setView('pos')} />}
      {view === 'stats' && <StatsView onBack={() => setView('pos')} />}
      {view === 'kitchen' && <KitchenView onBack={() => setView('pos')} />}

      {showPinModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 22, padding: '2.5rem 2rem', width: 340, textAlign: 'center'
          }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🔒</div>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: 'var(--orange)', marginBottom: 6 }}>
              {pinTarget === 'config' ? 'Configuración' : pinTarget === 'history' ? 'Historial' : 'Estadísticas'}
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Ingresá el PIN</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: pinInput.length > i ? 'var(--orange)' : 'var(--bg4)',
                  border: `2px solid ${pinError ? 'var(--red)' : 'var(--border)'}`,
                  transition: 'background 0.15s'
                }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {[1,2,3,4,5,6,7,8,9,'','0','⌫'].map((k, i) => (
                <button key={i} onClick={() => k !== '' && handlePinKey(String(k))} style={{
                  height: 54, borderRadius: 12, fontSize: k === '⌫' ? 18 : 22, fontWeight: 700,
                  background: k === '' ? 'transparent' : 'var(--bg3)',
                  border: k === '' ? 'none' : '1px solid var(--border)',
                  color: pinError ? 'var(--red)' : 'var(--text)',
                  cursor: k === '' ? 'default' : 'pointer',
                }}>{k}</button>
              ))}
            </div>
            {pinError && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10, fontWeight: 700 }}>PIN incorrecto ✗</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPinModal(false)} style={{
                flex: 1, padding: '12px', borderRadius: 12, background: 'var(--bg4)',
                color: 'var(--text2)', fontSize: 14, fontWeight: 700,
                border: '1px solid var(--border)', cursor: 'pointer'
              }}>Cancelar</button>
              <button onClick={handlePinSubmit} disabled={pinInput.length < 4} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: pinInput.length >= 4 ? 'var(--orange)' : 'var(--bg4)',
                color: pinInput.length >= 4 ? '#000' : 'var(--text2)',
                fontSize: 14, fontWeight: 800, border: 'none',
                cursor: pinInput.length >= 4 ? 'pointer' : 'default'
              }}>Entrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
