/**
Finary Field — Web Preview

Single-file React component (App.jsx) suitable for Vite / Create React App.

Features:
• Fibonacci/golden-spiral canvas animation
• 377 Hz tone generator (play / pause / detune control)
• 17° vortex overlay toggle
• Scripture overlay carousel
• Countdown (configurable target date)
• Share (copy link) button

Usage:
1. npm create vite@latest finary-field -- --template react
2. Replace src/App.jsx with this file
3. npm install && npm run dev
*/

import React, { useRef, useEffect, useState } from 'react';

export default function App() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(true);
  const [show17, setShow17] = useState(true);
  const [freq, setFreq] = useState(377);
  const [detune, setDetune] = useState(0);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [targetDate, setTargetDate] = useState(() => {
    const now = new Date();
    const year = now.getMonth() > 4 || (now.getMonth() === 4 && now.getDate() > 28)
      ? now.getFullYear() + 1
      : now.getFullYear();
    return new Date(`${year}-05-28T00:00:00`);
  });

  const [countdown, setCountdown] = useState('');

  const scriptureList = [
    'Psalm 19:1 — The heavens declare the glory of God; the sky proclaims the work of his hands.',
    'John 1:3 — Through him all things were made; without him nothing was made that has been made.',
    'Colossians 1:17 — He is before all things, and in him all things hold together.',
    'Psalm 46:10 — Be still, and know that I am God.'
  ];
  const [scriptureIndex, setScriptureIndex] = useState(0);

  // Scripture carousel
  useEffect(() => {
    const id = setInterval(() => {
      setScriptureIndex(i => (i + 1) % scriptureList.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  // Countdown updater
  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      const diff = targetDate - now;
      if (diff <= 0) {
        setCountdown('Now');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      setCountdown(`${days}d ${hours}h ${mins}m ${secs}s`);
    }, 500);

    return () => clearInterval(iv);
  }, [targetDate]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  function startTone() {
    if (isPlaying) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.value = 0.15; // gentle volume

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    audioCtxRef.current = ctx;
    oscRef.current = osc;
    gainRef.current = gain;
    setIsPlaying(true);
  }

  function stopTone() {
    if (!isPlaying) return;
    try { oscRef.current?.stop(); } catch (e) {}
    try { audioCtxRef.current?.close(); } catch (e) {}
    oscRef.current = null;
    audioCtxRef.current = null;
    gainRef.current = null;
    setIsPlaying(false);
  }

  // Update frequency/detune live
  useEffect(() => {
    if (isPlaying && oscRef.current) {
      oscRef.current.frequency.value = freq;
      oscRef.current.detune.value = detune;
    }
  }, [freq, detune, isPlaying]);

  // Canvas: Golden Spiral Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = null;
    let t0 = performance.now();

    function draw(now) {
      const w = canvas.width = canvas.clientWidth * devicePixelRatio;
      const h = canvas.height = canvas.clientHeight * devicePixelRatio;
      const cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Background pulse
      const elapsed = (now - t0) / 1000;
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 0.8);
      ctx.fillStyle = `rgba(8, 6, 12, ${0.25 * pulse})`;
      ctx.fillRect(0, 0, w, h);

      // Golden spirals
      const a = Math.min(w, h) * 0.02 * (1 + 0.02 * Math.sin(elapsed * 0.5));
      const phi = (1 + Math.sqrt(5)) / 2;
      ctx.lineWidth = 2 * devicePixelRatio;

      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        for (let ang = -Math.PI * 2; ang < Math.PI * 2; ang += 0.01) {
          const r = a * Math.pow(phi, ang / (Math.PI * 0.8) + i * 0.5);
          const x = cx + r * Math.cos(ang + elapsed * 0.1 * (i + 1));
          const y = cy + r * Math.sin(ang + elapsed * 0.1 * (i + 1));
          if (ang === -Math.PI * 2) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const alpha = 0.08 + 0.12 * (i / 6) + 0.2 * pulse;
        ctx.strokeStyle = `rgba(255, 215, 120, ${alpha})`;
        ctx.stroke();
      }

      // Central glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.4);
      grd.addColorStop(0, 'rgba(255, 238, 170, 0.25)');
      grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // 17° vortex overlay
      if (show17) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((17 * Math.PI) / 180);
        ctx.strokeStyle = 'rgba(255, 120, 120, 0.85)';
        ctx.lineWidth = 3 * devicePixelRatio;
        ctx.beginPath();
        ctx.moveTo(-w / 2, 0);
        ctx.lineTo(w / 2, 0);
        ctx.stroke();
        ctx.restore();

        // Label
        ctx.font = `${14 * devicePixelRatio}px serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const labelX = cx + Math.cos(17 * Math.PI / 180) * 80 * devicePixelRatio;
        const labelY = cy + Math.sin(17 * Math.PI / 180) * 80 * devicePixelRatio;
        ctx.fillText('17° vortex', labelX, labelY);
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [show17]);

  function copyShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => alert('Share link copied!'))
      .catch(() => alert('Copy failed — try sharing manually.'));
  }

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#060306'
    }}>
      <header style={{
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#060306aa'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>The Finary Field — Web Preview</h1>
          <div style={{ opacity: 0.8, fontSize: 12 }}>David's Key • 377 Hz • 17° Vortex</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <div style={{ fontWeight: 600 }}>{countdown}</div>
            <div style={{ opacity: 0.7, fontSize: 11 }}>Countdown</div>
          </div>
          <button
            onClick={copyShare}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: '#ffd580',
              border: 'none',
              cursor: 'pointer',
              color: '#000'
            }}
          >
            Share
          </button>
        </div>
      </header>

      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 18,
        padding: 18
      }}>
        <section style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 6px 30px rgba(0,0,0,0.6)'
        }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          <div style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            background: 'rgba(0,0,0,0.45)',
            padding: 10,
            borderRadius: 8,
            maxWidth: 520
          }}>
            <div style={{ fontSize: 13 }}>Scripture</div>
            <div style={{ fontSize: 14, lineHeight: 1.25 }}>
              {scriptureList[scriptureIndex]}
            </div>
          </div>
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Tone Generator */}
          <div style={{ padding: 12, borderRadius: 12, background: '#080612aa' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Tone Generator</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => isPlaying ? stopTone() : startTone()}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: isPlaying ? '#ff6b6b' : '#78c2ff',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff'
                }}
              >
                {isPlaying ? 'Stop' : 'Play'}
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <label style={{ fontSize: 12 }}>Frequency: {freq} Hz</label>
                <input
                  type='range'
                  min='50'
                  max='2000'
                  value={freq}
                  onChange={e => setFreq(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <label style={{ fontSize: 12 }}>Detune: {detune} cents</label>
                <input
                  type='range'
                  min='-100'
                  max='100'
                  value={detune}
                  onChange={e => setDetune(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              Note: mobile audio pitch may vary. Use detune to calibrate.
            </div>
          </div>

          {/* Controls */}
          <div style={{ padding: 12, borderRadius: 12, background: '#080612aa' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Controls</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type='checkbox'
                  checked={show17}
                  onChange={e => setShow17(e.target.checked)}
                />{' '}
                Show 17° overlay
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
              <label style={{ fontSize: 12 }}>Target date</label>
              <input
                type='date'
                value={targetDate.toISOString().slice(0, 10)}
                onChange={e => setTargetDate(new Date(e.target.value))}
              />
            </div>
          </div>

          {/* About */}
          <div style={{
            padding: 12,
            borderRadius: 12,
            background: '#080612aa',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <h3 style={{ margin: 0 }}>About</h3>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              This is a responsive preview. Use it as the core interactive of your PWA or wrap it in Android with a Trusted Web Activity.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => alert('Exporting assets... (not implemented in preview)')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#444'
                }}
              >
                Export
              </button>
              <button
                onClick={() => navigator.vibrate ? navigator.vibrate(50) : alert('Vibrate not supported')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#444'
                }}
              >
                Haptic Test
              </button>
            </div>
          </div>

          {/* Safety */}
          <div style={{ padding: 12, borderRadius: 12, background: '#080612aa' }}>
            <h3 style={{ margin: 0 }}>Safety</h3>
            <div style={{ fontSize: 13 }}>
              Keep volume low; avoid prolonged exposure to pure tones. Avoid flashing visuals for photosensitive users — use system accessibility settings.
            </div>
          </div>
        </aside>
      </main>

      <footer style={{
        padding: 12,
        textAlign: 'center',
        background: '#060306aa',
        fontSize: 12
      }}>
        <small>Built with love for Eliana — David's Key 377 Hz • 17°</small>
      </footer>
    </div>
  );
}
