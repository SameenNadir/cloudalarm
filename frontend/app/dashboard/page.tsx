'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:4000';
const TERRAFORM_DIR = 'C:\\Users\\#FZHZI\\cloudalarm\\test-terraform';

type Scan = {
  id: string;
  terraform_dir: string;
  status: string;
  message: string;
  scanned_at: string;
};

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [scanning, setScanning] = useState(false);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [time, setTime] = useState('');
  const [activeNav, setActiveNav] = useState('DASHBOARD');
  const [hoveredNav, setHoveredNav] = useState('');
  const [hoveredRow, setHoveredRow] = useState('');

  useEffect(() => {
    fetchScans();
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  async function fetchScans() {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/drift/scans`);
      setScans(res.data.scans);
    } catch (err) {
      console.error('Failed to fetch scans:', err);
    }
  }

  async function runScan() {
    setScanning(true);
    setError('');
    setLatestResult(null);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/drift/scan`, {
        terraformDir: TERRAFORM_DIR,
      });
      setLatestResult(res.data);
      fetchScans();
    } catch (err) {
      setError('ERR: Connection refused. Verify backend is running on :4000');
    } finally {
      setScanning(false);
    }
  }

  const inSyncCount = scans.filter(s => s.status === 'IN_SYNC').length;
  const driftCount = scans.filter(s => s.status === 'DRIFT_DETECTED').length;

  const navItems = [
    { icon: '▸', label: 'DASHBOARD' },
    { icon: '▸', label: 'SCANS' },
    { icon: '▸', label: 'ALERTS' },
    { icon: '▸', label: 'SETTINGS' },
    { icon: '▸', label: 'BILLING' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #020208; font-family: 'Inter', sans-serif; color: #e8eaf0; }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #00ff88; }
          50% { opacity: 0.6; box-shadow: 0 0 20px #00ff88; }
        }
        @keyframes scanSlide {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes glowPulse {
          0%, 100% { text-shadow: 0 0 10px #00e5ff60; }
          50% { text-shadow: 0 0 25px #00e5ffaa, 0 0 40px #00e5ff40; }
        }
        @keyframes borderGlow {
          0%, 100% { box-shadow: 0 0 8px #00e5ff20; }
          50% { box-shadow: 0 0 20px #00e5ff50; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .logo-text {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 800;
          font-size: 17px;
          color: #00e5ff;
          animation: glowPulse 3s ease-in-out infinite;
          letter-spacing: -0.5px;
        }

        .clock {
          font-family: 'JetBrains Mono', monospace;
          font-size: 20px;
          font-weight: 700;
          color: #00ff88;
          text-shadow: 0 0 15px #00ff8870;
          transition: all 0.3s;
        }

        .run-btn {
          background: transparent;
          border: 1px solid #00e5ff;
          color: #00e5ff;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          padding: 11px 24px;
          border-radius: 6px;
          cursor: pointer;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: all 0.25s ease;
          text-shadow: 0 0 10px #00e5ff80;
          animation: borderGlow 2s ease-in-out infinite;
        }
        .run-btn:hover {
          background: #00e5ff18;
          box-shadow: 0 0 30px #00e5ff50;
          transform: translateY(-1px);
          letter-spacing: 2px;
        }
        .run-btn:active { transform: translateY(0px); }
        .run-btn:disabled {
          border-color: #1a3a4a;
          color: #2a5a6a;
          cursor: not-allowed;
          box-shadow: none;
          text-shadow: none;
          background: transparent;
          animation: none;
          letter-spacing: 1px;
          transform: none;
        }

        .stat-card {
          background: #07070f;
          border: 1px solid #15152a;
          border-radius: 12px;
          padding: 22px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          animation: fadeInUp 0.5s ease forwards;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          border-color: #25254a;
        }
        .stat-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          transition: opacity 0.3s;
        }
        .stat-card.purple::after { background: linear-gradient(90deg, transparent, #a855f7, transparent); }
        .stat-card.green::after { background: linear-gradient(90deg, transparent, #00ff88, transparent); }
        .stat-card.red::after { background: linear-gradient(90deg, transparent, #ff4466, transparent); }
        .stat-card.purple:hover { box-shadow: 0 8px 30px #a855f720; }
        .stat-card.green:hover { box-shadow: 0 8px 30px #00ff8820; }
        .stat-card.red:hover { box-shadow: 0 8px 30px #ff446620; }

        .scan-row {
          background: #07070f;
          border: 1px solid #12122a;
          border-left: 3px solid transparent;
          border-radius: 8px;
          padding: 14px 18px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 16px;
          margin-bottom: 8px;
          transition: all 0.25s ease;
          animation: rowFadeIn 0.4s ease forwards;
        }
        .scan-row.drift { border-left-color: #ff4466; }
        .scan-row.sync { border-left-color: #00ff88; }
        .scan-row.drift:hover {
          background: #0d0308;
          border-color: #ff446630;
          border-left-color: #ff4466;
          box-shadow: 0 4px 20px #ff446615;
          transform: translateX(4px);
        }
        .scan-row.sync:hover {
          background: #030d08;
          border-color: #00ff8830;
          border-left-color: #00ff88;
          box-shadow: 0 4px 20px #00ff8815;
          transform: translateX(4px);
        }

        .badge-drift {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 4px;
          background: #ff446615; color: #ff6688;
          border: 1px solid #ff446640;
          font-size: 12px; font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.5px;
          text-shadow: 0 0 8px #ff446660;
          transition: all 0.2s;
        }
        .badge-sync {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 4px;
          background: #00ff8815; color: #00ff88;
          border: 1px solid #00ff8840;
          font-size: 12px; font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.5px;
          text-shadow: 0 0 8px #00ff8860;
          transition: all 0.2s;
        }

        .dot-pulse {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #00ff88;
          animation: pulse 2s ease-in-out infinite;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #020208; }
        ::-webkit-scrollbar-thumb { background: #15152a; border-radius: 2px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#020208' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: '220px', background: '#04040c', borderRight: '1px solid #10102a', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh' }}>

          {/* Logo */}
          <div style={{ padding: '22px 18px', borderBottom: '1px solid #10102a' }}>
            <div className="logo-text">☁ CloudAlarm</div>
            {/* CHANGED: version text from #005566 → #3a8a9a (visible teal) */}
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#3a8a9a', marginTop: '5px', letterSpacing: '2px' }}>v0.4.0-beta</div>
          </div>

          {/* Clock */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #0a0a1a' }}>
            {/* CHANGED: "SYS TIME" label from #2a4a44 → #5aaa99 (visible muted green) */}
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#5aaa99', letterSpacing: '1.5px', marginBottom: '5px', fontWeight: 700 }}>SYS TIME</div>
            <div className="clock">{time || '--:--:--'}</div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '14px 10px', flex: 1 }}>
            {/* CHANGED: "// NAVIGATION" label from #2a2a4a → #5a6aaa (visible muted blue) */}
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#5a6aaa', letterSpacing: '2px', padding: '0 14px', marginBottom: '10px', fontWeight: 700 }}>// NAVIGATION</div>
            {navItems.map(item => {
              const isActive = activeNav === item.label;
              const isHovered = hoveredNav === item.label;
              return (
                <div
                  key={item.label}
                  onClick={() => setActiveNav(item.label)}
                  onMouseEnter={() => setHoveredNav(item.label)}
                  onMouseLeave={() => setHoveredNav('')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '6px', marginBottom: '4px',
                    fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: 700,
                    letterSpacing: '1px', cursor: 'pointer',
                    borderLeft: `2px solid ${isActive ? '#00e5ff' : 'transparent'}`,
                    background: isActive ? '#0a0a1f' : isHovered ? '#080818' : 'transparent',
                    // CHANGED: inactive nav from #5a6a88 → #9aaac8 (clearly readable), hovered → #d8e0f0
                    color: isActive ? '#00e5ff' : isHovered ? '#d8e0f0' : '#9aaac8',
                    textShadow: isActive ? '0 0 10px #00e5ff60' : 'none',
                    boxShadow: isActive ? 'inset 0 0 20px #00e5ff08' : 'none',
                    transition: 'all 0.2s ease',
                    transform: isHovered && !isActive ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  <span style={{
                    // CHANGED: inactive arrow from #3a4a62 → #6a7a99
                    color: isActive ? '#00e5ff' : isHovered ? '#9aaac8' : '#6a7a99',
                    transition: 'all 0.2s',
                    transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                  }}>▸</span>
                  {item.label}
                </div>
              );
            })}
          </nav>

          {/* Online status */}
          <div style={{ padding: '16px 18px', borderTop: '1px solid #10102a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#030d07', border: '1px solid #00ff8825', borderRadius: '6px' }}>
              <div className="dot-pulse" />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00ff88', fontWeight: 700, letterSpacing: '1px' }}>API ONLINE</span>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex: 1, marginLeft: '220px' }}>

          {/* Header */}
          <header style={{ background: '#04040c', borderBottom: '1px solid #10102a', padding: '0 32px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, animation: 'fadeInDown 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* CHANGED: prompt prefix from #2a5a6a → #4a8a9a */}
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#4a8a9a', fontWeight: 600 }}>root@cloudalarm:~$</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#00e5ff', textShadow: '0 0 10px #00e5ff60' }}>dashboard --live</span>
            </div>
            <button className="run-btn" onClick={runScan} disabled={scanning}>
              {scanning
                ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> SCANNING...
                  </span>
                : '⚡ RUN SCAN'
              }
            </button>
          </header>

          <div style={{ padding: '28px 32px' }}>

            {/* Result banner */}
            {latestResult && (
              <div style={{ marginBottom: '24px', padding: '16px 20px', borderRadius: '10px', background: latestResult.status === 'IN_SYNC' ? '#030d07' : '#0d0305', border: `1px solid ${latestResult.status === 'IN_SYNC' ? '#00ff8830' : '#ff446630'}`, display: 'flex', alignItems: 'center', gap: '14px', animation: 'fadeInDown 0.4s ease', boxShadow: latestResult.status === 'IN_SYNC' ? '0 0 20px #00ff8810' : '0 0 20px #ff446610' }}>
                <span style={{ fontSize: '22px' }}>{latestResult.status === 'IN_SYNC' ? '✅' : '🚨'}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '15px', color: latestResult.status === 'IN_SYNC' ? '#00ff88' : '#ff6688', margin: '0 0 4px', textShadow: latestResult.status === 'IN_SYNC' ? '0 0 10px #00ff8850' : '0 0 10px #ff446650' }}>
                    {latestResult.status === 'IN_SYNC' ? '✓ All Clear — Infrastructure matches Terraform code' : '✗ Drift Detected — Live infra does not match Terraform code'}
                  </p>
                  {/* CHANGED: banner subtext from #7a8499 → #a8b4cc */}
                  <p style={{ fontSize: '13px', color: '#a8b4cc', margin: 0 }}>{latestResult.message}</p>
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginBottom: '24px', padding: '14px 18px', borderRadius: '8px', background: '#0d0305', border: '1px solid #ff446630', color: '#ff6688', fontSize: '13px', fontFamily: 'JetBrains Mono', animation: 'fadeInDown 0.3s ease' }}>
                ✗ {error}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { cls: 'purple', label: 'TOTAL SCANS', value: scans.length, color: '#c084fc', shadow: '#a855f770', sub: 'all time' },
                { cls: 'green', label: 'IN SYNC', value: inSyncCount, color: '#00ff88', shadow: '#00ff8870', sub: 'no issues found' },
                { cls: 'red', label: 'DRIFT DETECTED', value: driftCount, color: '#ff4466', shadow: '#ff446670', sub: 'requires action' },
              ].map((stat, i) => (
                <div key={stat.label} className={`stat-card ${stat.cls}`} style={{ animationDelay: `${i * 0.1}s` }}>
                  {/* CHANGED: card label from #4a4a6a → #8a8ab0 (clearly visible) */}
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#8a8ab0', marginBottom: '14px', letterSpacing: '1px', fontFamily: 'JetBrains Mono' }}>{stat.label}</div>
                  <div style={{ fontSize: '44px', fontWeight: 800, color: stat.color, lineHeight: 1, textShadow: `0 0 20px ${stat.shadow}`, fontFamily: 'JetBrains Mono' }}>{stat.value}</div>
                  {/* CHANGED: card sub from #3a3a5a → #6a6a9a */}
                  <div style={{ fontSize: '12px', color: '#6a6a9a', marginTop: '8px', fontWeight: 600 }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Scan history */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                {/* CHANGED: "// SCAN HISTORY" from #3a3a6a → #6a6aaa */}
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#6a6aaa', letterSpacing: '1.5px', fontWeight: 700 }}>// SCAN HISTORY</div>
                {/* CHANGED: records badge text from #4a4a7a → #7a7aaa */}
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', background: '#0a0a1a', color: '#7a7aaa', padding: '4px 12px', borderRadius: '4px', border: '1px solid #20204a', letterSpacing: '1px', fontWeight: 700 }}>{scans.length} RECORDS</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 150px', gap: '16px', padding: '8px 18px', marginBottom: '8px' }}>
                {/* CHANGED: table headers from #2a2a5a → #6a6aaa */}
                {['STATUS', 'TARGET PATH', 'TIMESTAMP'].map(h => (
                  <div key={h} style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', fontWeight: 700, color: '#6a6aaa', letterSpacing: '1.5px' }}>{h}</div>
                ))}
              </div>

              {scans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#4a4a7a', fontFamily: 'JetBrains Mono', fontSize: '13px', background: '#04040c', borderRadius: '10px', border: '1px solid #10102a' }}>
                  NO RECORDS — RUN FIRST SCAN
                </div>
              ) : (
                scans.map((scan, index) => (
                  <div
                    key={scan.id}
                    className={`scan-row ${scan.status === 'DRIFT_DETECTED' ? 'drift' : 'sync'}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onMouseEnter={() => setHoveredRow(scan.id)}
                    onMouseLeave={() => setHoveredRow('')}
                  >
                    <div style={{ width: '140px', flexShrink: 0 }}>
                      {scan.status === 'DRIFT_DETECTED'
                        ? <span className="badge-drift" style={{ boxShadow: hoveredRow === scan.id ? '0 0 12px #ff446640' : 'none' }}>✗ DRIFT</span>
                        : <span className="badge-sync" style={{ boxShadow: hoveredRow === scan.id ? '0 0 12px #00ff8840' : 'none' }}>✓ SYNC</span>
                      }
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* CHANGED: path text from #c8cfe0 → #d8e2f4 (brighter) */}
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#d8e2f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {scan.terraform_dir}
                      </div>
                      {index === 0 && (
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00e5ff', marginTop: '4px', letterSpacing: '0.5px', textShadow: '0 0 8px #00e5ff60', fontWeight: 700 }}>← LATEST</div>
                      )}
                    </div>

                    {/* CHANGED: timestamp from #4a4a7a → #7a8aaa, hovered → #b0bcd8 */}
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: hoveredRow === scan.id ? '#b0bcd8' : '#7a8aaa', textAlign: 'right', flexShrink: 0, transition: 'color 0.2s', fontWeight: 600 }}>
                      {new Date(scan.scanned_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
