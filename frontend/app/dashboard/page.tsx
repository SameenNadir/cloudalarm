'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import DriftCard from '../../components/DriftCard';

const BACKEND_URL = 'http://localhost:4000';
const TERRAFORM_DIR = 'C:\\Users\\#FZHZI\\cloudalarm\\test-terraform';

export default function DashboardPage() {
  const [scans, setScans] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchScans(); }, []);

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
      setError('Scan failed. Make sure the backend is running.');
    } finally {
      setScanning(false);
    }
  }

  const inSyncCount = scans.filter((s: any) => s.status === 'IN_SYNC').length;
  const driftCount = scans.filter((s: any) => s.status === 'DRIFT_DETECTED').length;

return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e2e8f0', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <nav style={{ background: '#0f0f1a', borderBottom: '1px solid #1e1e2e', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>☁️</span>
          <span style={{ fontWeight: 700, fontSize: '20px', color: '#fff' }}>CloudAlarm</span>
          <span style={{ background: '#1e1e3f', color: '#818cf8', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>BETA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#64748b', fontSize: '14px' }}>Infrastructure Drift Monitor</span>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
        </div>
      </nav>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Scans', value: scans.length, color: '#818cf8', bg: '#1e1e3f' },
            { label: 'In Sync', value: inSyncCount, color: '#22c55e', bg: '#0f2a1a' },
            { label: 'Drift Detected', value: driftCount, color: '#f87171', bg: '#2a0f0f' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.color}22`, borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: '16px', padding: '28px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '18px', color: '#fff', margin: 0 }}>Run Drift Scan</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '6px 0 0' }}>Compares your live infrastructure against your Terraform code</p>
          </div>
          <button onClick={runScan} disabled={scanning} style={{ background: scanning ? '#1e3a5f' : 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 28px', fontWeight: 700, fontSize: '15px', cursor: scanning ? 'not-allowed' : 'pointer', minWidth: '140px' }}>
            {scanning ? '⏳ Scanning...' : '🔍 Run Scan'}
          </button>
        </div>
        {error && (
          <div style={{ background: '#2a0f0f', border: '1px solid #f8717140', borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#f87171' }}>
            ⚠️ {error}
          </div>
        )}
        {latestResult && (
          <div style={{ background: latestResult.status === 'IN_SYNC' ? '#0f2a1a' : '#2a0f0f', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #ffffff20' }}>
            <p style={{ fontWeight: 700, fontSize: '16px', margin: '0 0 6px', color: latestResult.status === 'IN_SYNC' ? '#22c55e' : '#f87171' }}>
              {latestResult.status === 'IN_SYNC' ? '✅ All Clear' : '🚨 Drift Detected!'}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>{latestResult.message}</p>
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '18px', color: '#fff', margin: 0 }}>Scan History</h2>
            <span style={{ background: '#1e1e2e', color: '#64748b', fontSize: '12px', padding: '4px 12px', borderRadius: '20px' }}>{scans.length} scans</span>
          </div>
          {scans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: '#334155' }}>No scans yet. Click Run Scan to get started!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {scans.map((scan: any) => (
                <DriftCard key={scan.id} scan={scan} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}