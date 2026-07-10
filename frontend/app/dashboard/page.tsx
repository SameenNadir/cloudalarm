'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../lib/supabase';

const BACKEND_URL = 'http://localhost:4000';

type Scan = {
  id: string;
  terraform_dir: string;
  status: string;
  message: string;
  output?: string;
  scanned_at: string;
  project_id?: string;
};

type Project = {
  id: string;
  name: string;
  terraform_dir: string;
  created_at: string;
};

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [scanning, setScanning] = useState(false);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [time, setTime] = useState('');
  const [activeNav, setActiveNav] = useState('DASHBOARD');
  const [hoveredNav, setHoveredNav] = useState('');
  const [hoveredRow, setHoveredRow] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDir, setNewProjectDir] = useState('');
  const [addingProject, setAddingProject] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);

  useEffect(() => {
    fetchScans();
    fetchProjects();
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email || '');
    });
    return () => clearInterval(t);
  }, []);

  async function fetchProjects() {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/projects`);
      setProjects(res.data.projects);
      if (res.data.projects.length > 0 && !activeProject) {
        setActiveProject(res.data.projects[0]);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }

  async function addProject() {
    if (!newProjectName || !newProjectDir) return;
    setAddingProject(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/projects`, {
        name: newProjectName,
        terraformDir: newProjectDir,
      });
      setProjects(prev => [res.data.project, ...prev]);
      setActiveProject(res.data.project);
      setNewProjectName('');
      setNewProjectDir('');
      setShowAddProject(false);
    } catch (err) {
      console.error('Failed to add project:', err);
    } finally {
      setAddingProject(false);
    }
  }

  async function deleteProject(id: string) {
    try {
      await axios.delete(`${BACKEND_URL}/api/projects/${id}`);
      const remaining = projects.filter(p => p.id !== id);
      setProjects(remaining);
      if (activeProject?.id === id) {
        setActiveProject(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  async function fetchScans() {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/drift/scans`);
      setScans(res.data.scans);
    } catch (err) {
      console.error('Failed to fetch scans:', err);
    }
  }

  async function runScan() {
    if (!activeProject) {
      setError('No project selected. Add a project first.');
      return;
    }
    setScanning(true);
    setError('');
    setLatestResult(null);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/drift/scan`, {
        terraformDir: activeProject.terraform_dir,
        userEmail,
        projectId: activeProject.id,
      });
      setLatestResult(res.data);
      fetchScans();
    } catch (err) {
      setError('ERR: Connection refused. Verify backend is running on :4000');
    } finally {
      setScanning(false);
    }
  }

  async function deleteScan(id: string) {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('scans').delete().eq('id', id);
      if (!error) setScans(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete scan:', err);
    } finally {
      setDeletingId('');
    }
  }

  async function deleteAllScans() {
    try {
      await supabase.from('scans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setScans([]);
      setShowDeleteAll(false);
    } catch (err) {
      console.error('Failed to delete all scans:', err);
    }
  }

  function exportCSV() {
    const headers = ['ID', 'Status', 'Terraform Dir', 'Message', 'Scanned At'];
    const rows = filteredScans.map(s => [s.id, s.status, s.terraform_dir, s.message, s.scanned_at]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudalarm-scans-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getTimeSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'just now';
  }

  const projectScans = activeProject
    ? scans.filter(s => s.terraform_dir === activeProject.terraform_dir)
    : scans;

  const inSyncCount = projectScans.filter(s => s.status === 'IN_SYNC').length;
  const driftCount = projectScans.filter(s => s.status === 'DRIFT_DETECTED').length;
  const lastScan = projectScans[0];
  const filteredScans = projectScans.filter(s =>
    s.terraform_dir.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 8px #00ff88; } 50% { opacity: 0.6; box-shadow: 0 0 20px #00ff88; } }
        @keyframes glowPulse { 0%, 100% { text-shadow: 0 0 10px #00e5ff60; } 50% { text-shadow: 0 0 25px #00e5ffaa, 0 0 40px #00e5ff40; } }
        @keyframes borderGlow { 0%, 100% { box-shadow: 0 0 8px #00e5ff20; } 50% { box-shadow: 0 0 20px #00e5ff50; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rowFadeIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .logo-text { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 17px; color: #00e5ff; animation: glowPulse 3s ease-in-out infinite; letter-spacing: -0.5px; }
        .clock { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 700; color: #00ff88; text-shadow: 0 0 15px #00ff8870; }
        .run-btn { background: transparent; border: 1px solid #00e5ff; color: #00e5ff; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px; padding: 11px 24px; border-radius: 6px; cursor: pointer; letter-spacing: 1px; text-transform: uppercase; transition: all 0.25s ease; text-shadow: 0 0 10px #00e5ff80; animation: borderGlow 2s ease-in-out infinite; }
        .run-btn:hover { background: #00e5ff18; box-shadow: 0 0 30px #00e5ff50; transform: translateY(-1px); letter-spacing: 2px; }
        .run-btn:disabled { border-color: #1a3a4a; color: #2a5a6a; cursor: not-allowed; box-shadow: none; text-shadow: none; background: transparent; animation: none; letter-spacing: 1px; transform: none; }
        .stat-card { background: #07070f; border: 1px solid #15152a; border-radius: 12px; padding: 22px; position: relative; overflow: hidden; transition: all 0.3s ease; animation: fadeInUp 0.5s ease forwards; }
        .stat-card:hover { transform: translateY(-3px); border-color: #25254a; }
        .stat-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .stat-card.purple::after { background: linear-gradient(90deg, transparent, #a855f7, transparent); }
        .stat-card.green::after { background: linear-gradient(90deg, transparent, #00ff88, transparent); }
        .stat-card.red::after { background: linear-gradient(90deg, transparent, #ff4466, transparent); }
        .stat-card.purple:hover { box-shadow: 0 8px 30px #a855f720; }
        .stat-card.green:hover { box-shadow: 0 8px 30px #00ff8820; }
        .stat-card.red:hover { box-shadow: 0 8px 30px #ff446620; }
        .scan-row { background: #07070f; border: 1px solid #12122a; border-left: 3px solid transparent; border-radius: 8px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 8px; transition: all 0.25s ease; animation: rowFadeIn 0.4s ease forwards; }
        .scan-row.drift { border-left-color: #ff4466; }
        .scan-row.sync { border-left-color: #00ff88; }
        .scan-row.drift:hover { background: #0d0308; border-color: #ff446630; border-left-color: #ff4466; box-shadow: 0 4px 20px #ff446615; transform: translateX(4px); }
        .scan-row.sync:hover { background: #030d08; border-color: #00ff8830; border-left-color: #00ff88; box-shadow: 0 4px 20px #00ff8815; transform: translateX(4px); }
        .badge-drift { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 4px; background: #ff446615; color: #ff6688; border: 1px solid #ff446640; font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px; text-shadow: 0 0 8px #ff446660; }
        .badge-sync { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 4px; background: #00ff8815; color: #00ff88; border: 1px solid #00ff8840; font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px; text-shadow: 0 0 8px #00ff8860; }
        .dot-pulse { width: 7px; height: 7px; border-radius: 50%; background: #00ff88; animation: pulse 2s ease-in-out infinite; }
        .logout-btn { width: 100%; background: transparent; border: 1px solid #ff446630; color: #ff6688; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; padding: 8px; border-radius: 6px; cursor: pointer; letter-spacing: 1px; transition: all 0.2s; }
        .logout-btn:hover { background: #ff446615; border-color: #ff446660; }
        .delete-btn { background: transparent; border: none; color: #3a2a3a; font-size: 13px; cursor: pointer; padding: 4px 6px; border-radius: 4px; transition: all 0.2s; flex-shrink: 0; }
        .delete-btn:hover { color: #ff6688; background: #ff446615; }
        .search-input { width: 100%; background: #07070f; border: 1px solid #15152a; border-radius: 6px; padding: 10px 16px 10px 36px; color: #d8e2f4; font-family: 'JetBrains Mono', monospace; font-size: 12px; outline: none; transition: all 0.2s; letter-spacing: 0.5px; }
        .search-input:focus { border-color: #00e5ff40; box-shadow: 0 0 15px #00e5ff10; }
        .search-input::placeholder { color: #3a3a6a; }
        .modal-overlay { position: fixed; inset: 0; background: #000000aa; backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal-box { background: #07070f; border: 1px solid #ff446640; border-radius: 12px; padding: 28px; width: 360px; box-shadow: 0 0 40px #ff446620; animation: modalFadeIn 0.2s ease forwards; }
        .modal-box.blue { border-color: #00e5ff40; box-shadow: 0 0 40px #00e5ff15; }
        .modal-confirm-btn { flex: 1; background: #ff446618; border: 1px solid #ff446650; color: #ff6688; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; padding: 9px; border-radius: 6px; cursor: pointer; letter-spacing: 1px; transition: all 0.2s; }
        .modal-confirm-btn:hover { background: #ff446630; }
        .modal-confirm-btn.blue { background: #00e5ff18; border-color: #00e5ff50; color: #00e5ff; }
        .modal-confirm-btn.blue:hover { background: #00e5ff30; }
        .modal-cancel-btn { flex: 1; background: transparent; border: 1px solid #20204a; color: #9aaac8; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; padding: 9px; border-radius: 6px; cursor: pointer; letter-spacing: 1px; transition: all 0.2s; }
        .modal-cancel-btn:hover { background: #0a0a1a; }
        .action-btn { background: transparent; border: 1px solid #20204a; color: #7a8aaa; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 4px; cursor: pointer; letter-spacing: 0.5px; transition: all 0.2s; }
        .action-btn:hover { background: #0a0a1a; border-color: #30305a; color: #d8e2f4; }
        .action-btn.danger:hover { border-color: #ff446640; color: #ff6688; background: #ff446610; }
        .modal-input { width: 100%; background: #04040c; border: 1px solid #15152a; border-radius: 6px; padding: 10px 14px; color: #d8e2f4; font-family: 'JetBrains Mono', monospace; font-size: 12px; outline: none; transition: all 0.2s; margin-bottom: 12px; }
        .modal-input:focus { border-color: #00e5ff40; }
        .modal-input::placeholder { color: #3a3a6a; }
        .projects-content { overflow: hidden; transition: max-height 0.3s ease, opacity 0.3s ease; }
        .projects-content.expanded { max-height: 600px; opacity: 1; }
        .projects-content.collapsed { max-height: 0; opacity: 0; }
        .diff-btn { background: transparent; border: 1px solid #1a1a3a; border-radius: 4px; color: #5a6aaa; cursor: pointer; font-size: 10px; padding: 4px 8px; font-family: 'JetBrains Mono', monospace; font-weight: 700; transition: all 0.2s; letter-spacing: 0.5px; }
        .diff-btn:hover { border-color: #00e5ff40; color: #00e5ff; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #020208; }
        ::-webkit-scrollbar-thumb { background: #15152a; border-radius: 2px; }
      `}</style>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#ff6688', letterSpacing: '2px', marginBottom: '10px', fontWeight: 700 }}>⏻ CONFIRM LOGOUT</div>
            <div style={{ fontSize: '13px', color: '#9aaac8', marginBottom: '22px', lineHeight: 1.6 }}>Are you sure you want to log out of <span style={{ color: '#d8e2f4', fontWeight: 600 }}>{userEmail}</span>?</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="modal-cancel-btn" onClick={() => setShowLogoutConfirm(false)}>CANCEL</button>
              <button className="modal-confirm-btn" onClick={handleLogout}>YES, LOGOUT</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAll && (
        <div className="modal-overlay" onClick={() => setShowDeleteAll(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#ff6688', letterSpacing: '2px', marginBottom: '10px', fontWeight: 700 }}>⚠ DELETE ALL SCANS</div>
            <div style={{ fontSize: '13px', color: '#9aaac8', marginBottom: '22px', lineHeight: 1.6 }}>This will permanently delete all <span style={{ color: '#ff6688', fontWeight: 700 }}>{projectScans.length} scan records</span>.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="modal-cancel-btn" onClick={() => setShowDeleteAll(false)}>CANCEL</button>
              <button className="modal-confirm-btn" onClick={deleteAllScans}>DELETE ALL</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
          <div className="modal-box blue" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00e5ff', letterSpacing: '2px', marginBottom: '16px', fontWeight: 700 }}>+ ADD PROJECT</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#5a6aaa', letterSpacing: '1px', marginBottom: '6px' }}>PROJECT NAME</div>
            <input className="modal-input" placeholder="e.g. Production" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#5a6aaa', letterSpacing: '1px', marginBottom: '6px' }}>TERRAFORM DIRECTORY</div>
            <input className="modal-input" placeholder="C:\path\to\terraform" value={newProjectDir} onChange={e => setNewProjectDir(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button className="modal-cancel-btn" onClick={() => setShowAddProject(false)}>CANCEL</button>
              <button className="modal-confirm-btn blue" onClick={addProject} disabled={addingProject}>
                {addingProject ? '⟳ ADDING...' : '+ ADD PROJECT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diff Viewer Modal */}
      {selectedScan && (
        <div className="modal-overlay" onClick={() => setSelectedScan(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#07070f', border: '1px solid #00e5ff30', borderRadius: '12px', width: '700px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', animation: 'modalFadeIn 0.2s ease forwards', boxShadow: '0 0 40px #00e5ff10' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #10102a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: selectedScan.status === 'DRIFT_DETECTED' ? '#ff6688' : '#00ff88', letterSpacing: '2px', fontWeight: 700, marginBottom: '4px' }}>
                  {selectedScan.status === 'DRIFT_DETECTED' ? '🚨 DRIFT DETECTED — PLAN DIFF' : '✅ IN SYNC — PLAN OUTPUT'}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#3a4a62' }}>
                  {new Date(selectedScan.scanned_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedScan(null)}
                style={{ background: 'none', border: '1px solid #20204a', borderRadius: '6px', color: '#7a8aaa', cursor: 'pointer', fontSize: '12px', padding: '4px 10px', fontFamily: 'JetBrains Mono', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff446640'; e.currentTarget.style.color = '#ff6688'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#20204a'; e.currentTarget.style.color = '#7a8aaa'; }}>
                ✕ CLOSE
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px' }}>
              {selectedScan.output ? (
                <pre style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                  {selectedScan.output.split('\n').map((line, i) => {
                    let color = '#7a8aaa';
                    let bg = 'transparent';
                    if (line.trim().startsWith('+')) { color = '#00ff88'; bg = '#00ff8808'; }
                    else if (line.trim().startsWith('-')) { color = '#ff4466'; bg = '#ff446608'; }
                    else if (line.trim().startsWith('~')) { color = '#f59e0b'; bg = '#f59e0b08'; }
                    else if (line.includes('Plan:')) { color = '#00e5ff'; }
                    else if (line.includes('will be created') || line.includes('will be updated') || line.includes('will be destroyed')) { color = '#c084fc'; }
                    else if (line.startsWith('#')) { color = '#c084fc'; }
                    return (
                      <span key={i} style={{ display: 'block', color, background: bg, padding: bg !== 'transparent' ? '0 4px' : '0', borderRadius: '2px' }}>
                        {line || ' '}
                      </span>
                    );
                  })}
                </pre>
              ) : (
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#3a3a6a', textAlign: 'center', padding: '40px' }}>
                  NO OUTPUT AVAILABLE FOR THIS SCAN
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100vh', background: '#020208' }}>

        {/* Sidebar */}
        <aside style={{ width: '220px', background: '#04040c', borderRight: '1px solid #10102a', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto' }}>
          <div style={{ padding: '22px 18px', borderBottom: '1px solid #10102a' }}>
            <div className="logo-text">☁ CloudAlarm</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#3a8a9a', marginTop: '5px', letterSpacing: '2px' }}>v0.7.0-beta</div>
          </div>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #0a0a1a' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#5aaa99', letterSpacing: '1.5px', marginBottom: '5px', fontWeight: 700 }}>SYS TIME</div>
            <div className="clock">{time || '--:--:--'}</div>
          </div>
          <nav style={{ padding: '14px 10px' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#5a6aaa', letterSpacing: '2px', padding: '0 14px', marginBottom: '10px', fontWeight: 700 }}>// NAVIGATION</div>
            {navItems.map(item => {
              const isActive = activeNav === item.label;
              const isHovered = hoveredNav === item.label;
              return (
                <div key={item.label} onClick={() => setActiveNav(item.label)} onMouseEnter={() => setHoveredNav(item.label)} onMouseLeave={() => setHoveredNav('')}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '6px', marginBottom: '4px', fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', borderLeft: `2px solid ${isActive ? '#00e5ff' : 'transparent'}`, background: isActive ? '#0a0a1f' : isHovered ? '#080818' : 'transparent', color: isActive ? '#00e5ff' : isHovered ? '#d8e0f0' : '#9aaac8', textShadow: isActive ? '0 0 10px #00e5ff60' : 'none', transition: 'all 0.2s ease', transform: isHovered && !isActive ? 'translateX(4px)' : 'translateX(0)' }}>
                  <span style={{ color: isActive ? '#00e5ff' : isHovered ? '#9aaac8' : '#6a7a99', transition: 'all 0.2s', transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▸</span>
                  {item.label}
                </div>
              );
            })}
          </nav>

          {/* Projects */}
          <div style={{ borderTop: '1px solid #0a0a1a' }}>
            <div onClick={() => setProjectsExpanded(prev => !prev)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', margin: '8px 10px 4px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: '#9aaac8', transition: 'all 0.2s ease', userSelect: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#080818'; e.currentTarget.style.color = '#d8e0f0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aaac8'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#6a7a99', transition: 'transform 0.25s ease', display: 'inline-block', transform: projectsExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▸</span>
                PROJECTS
              </div>
              {projects.length > 0 && (
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', background: '#0a0a1a', color: '#5a6aaa', padding: '2px 7px', borderRadius: '4px', border: '1px solid #1a1a3a', fontWeight: 700 }}>{projects.length}</span>
              )}
            </div>
            <div className={`projects-content ${projectsExpanded ? 'expanded' : 'collapsed'}`}>
              <div style={{ padding: '0 10px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 4px', marginBottom: '6px' }}>
                  <button onClick={() => setShowAddProject(true)}
                    style={{ background: 'none', border: '1px solid #1a1a3a', borderRadius: '4px', color: '#5a6aaa', cursor: 'pointer', fontSize: '11px', padding: '2px 8px', fontFamily: 'JetBrains Mono', fontWeight: 700, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#00e5ff40'; e.currentTarget.style.color = '#00e5ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a3a'; e.currentTarget.style.color = '#5a6aaa'; }}>
                    + ADD
                  </button>
                </div>
                {projects.length === 0 ? (
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#3a3a6a', padding: '6px 14px' }}>No projects yet</div>
                ) : (
                  projects.map(p => (
                    <div key={p.id} onClick={() => setActiveProject(p)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: '6px', marginBottom: '2px', cursor: 'pointer', borderLeft: `2px solid ${activeProject?.id === p.id ? '#00e5ff' : 'transparent'}`, background: activeProject?.id === p.id ? '#0a0a1f' : 'transparent', transition: 'all 0.2s' }}
                      onMouseEnter={e => { if (activeProject?.id !== p.id) e.currentTarget.style.background = '#080818'; }}
                      onMouseLeave={e => { if (activeProject?.id !== p.id) e.currentTarget.style.background = 'transparent'; }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ fontSize: '12px' }}>📁</span>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', fontWeight: 700, color: activeProject?.id === p.id ? '#00e5ff' : '#9aaac8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: activeProject?.id === p.id ? '0 0 8px #00e5ff50' : 'none' }}>{p.name}</span>
                      </div>
                      <button type="button" onClick={e => { e.stopPropagation(); deleteProject(p.id); }}
                        style={{ background: 'none', border: 'none', color: '#2a2a4a', cursor: 'pointer', fontSize: '11px', flexShrink: 0, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ff6688'}
                        onMouseLeave={e => e.currentTarget.style.color = '#2a2a4a'}>✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ padding: '16px 18px', borderTop: '1px solid #10102a', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#030d07', border: '1px solid #00ff8825', borderRadius: '6px', marginBottom: '10px' }}>
              <div className="dot-pulse" />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#00ff88', fontWeight: 700, letterSpacing: '1px' }}>API ONLINE</span>
            </div>
            {userEmail && (
              <div style={{ marginBottom: '8px', padding: '8px 12px', background: '#07070f', border: '1px solid #15152a', borderRadius: '6px' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#5a6aaa', letterSpacing: '1px', marginBottom: '3px' }}>LOGGED IN AS</div>
                <div style={{ fontSize: '11px', color: '#9aaac8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
              </div>
            )}
            <button className="logout-btn" onClick={() => setShowLogoutConfirm(true)}>⏻ LOGOUT</button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, marginLeft: '220px' }}>
          <header style={{ background: '#04040c', borderBottom: '1px solid #10102a', padding: '0 32px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, animation: 'fadeInDown 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#4a8a9a', fontWeight: 600 }}>root@cloudalarm:~$</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#00e5ff', textShadow: '0 0 10px #00e5ff60' }}>dashboard --live</span>
              {lastScan && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#3a4a62', marginLeft: '8px' }}>last scan: <span style={{ color: '#5a6a8a' }}>{getTimeSince(lastScan.scanned_at)}</span></span>}
            </div>
            <button className="run-btn" onClick={runScan} disabled={scanning}>
              {scanning ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> SCANNING...</span> : '⚡ RUN SCAN'}
            </button>
          </header>

          <div style={{ padding: '28px 32px' }}>
            {latestResult && (
              <div style={{ marginBottom: '24px', padding: '16px 20px', borderRadius: '10px', background: latestResult.status === 'IN_SYNC' ? '#030d07' : '#0d0305', border: `1px solid ${latestResult.status === 'IN_SYNC' ? '#00ff8830' : '#ff446630'}`, display: 'flex', alignItems: 'center', gap: '14px', animation: 'fadeInDown 0.4s ease' }}>
                <span style={{ fontSize: '22px' }}>{latestResult.status === 'IN_SYNC' ? '✅' : '🚨'}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '15px', color: latestResult.status === 'IN_SYNC' ? '#00ff88' : '#ff6688', margin: '0 0 4px' }}>
                    {latestResult.status === 'IN_SYNC' ? '✓ All Clear — Infrastructure matches Terraform code' : '✗ Drift Detected — Live infra does not match Terraform code'}
                  </p>
                  <p style={{ fontSize: '13px', color: '#a8b4cc', margin: 0 }}>{latestResult.message}</p>
                </div>
              </div>
            )}
            {error && (
              <div style={{ marginBottom: '24px', padding: '14px 18px', borderRadius: '8px', background: '#0d0305', border: '1px solid #ff446630', color: '#ff6688', fontSize: '13px', fontFamily: 'JetBrains Mono' }}>
                ✗ {error}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { cls: 'purple', label: 'TOTAL SCANS', value: projectScans.length, color: '#c084fc', shadow: '#a855f770', sub: activeProject ? activeProject.name : 'all projects' },
                { cls: 'green', label: 'IN SYNC', value: inSyncCount, color: '#00ff88', shadow: '#00ff8870', sub: 'no issues found' },
                { cls: 'red', label: 'DRIFT DETECTED', value: driftCount, color: '#ff4466', shadow: '#ff446670', sub: 'requires action' },
              ].map((stat, i) => (
                <div key={stat.label} className={`stat-card ${stat.cls}`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#8a8ab0', marginBottom: '14px', letterSpacing: '1px', fontFamily: 'JetBrains Mono' }}>{stat.label}</div>
                  <div style={{ fontSize: '44px', fontWeight: 800, color: stat.color, lineHeight: 1, textShadow: `0 0 20px ${stat.shadow}`, fontFamily: 'JetBrains Mono' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: '#6a6a9a', marginTop: '8px', fontWeight: 600 }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Scan history */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#6a6aaa', letterSpacing: '1.5px', fontWeight: 700 }}>
                  // SCAN HISTORY {activeProject && <span style={{ color: '#3a4a6a' }}>— {activeProject.name}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="action-btn" onClick={exportCSV}>⬇ CSV</button>
                  <button className="action-btn danger" onClick={() => setShowDeleteAll(true)}>🗑 CLEAR ALL</button>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', background: '#0a0a1a', color: '#7a7aaa', padding: '4px 12px', borderRadius: '4px', border: '1px solid #20204a', letterSpacing: '1px', fontWeight: 700 }}>{filteredScans.length} RECORDS</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <input className="search-input" type="text" placeholder="SEARCH SCANS..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3a3a6a', fontSize: '13px' }}>🔍</span>
                {searchQuery && <button type="button" onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4a4a7a', cursor: 'pointer', fontSize: '13px' }}>✕</button>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 130px 80px', gap: '16px', padding: '8px 18px', marginBottom: '8px' }}>
                {['STATUS', 'TARGET PATH', 'TIMESTAMP', ''].map(h => (
                  <div key={h} style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', fontWeight: 700, color: '#6a6aaa', letterSpacing: '1.5px' }}>{h}</div>
                ))}
              </div>

              {filteredScans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#4a4a7a', fontFamily: 'JetBrains Mono', fontSize: '13px', background: '#04040c', borderRadius: '10px', border: '1px solid #10102a' }}>
                  {searchQuery ? 'NO RESULTS FOUND' : projects.length === 0 ? 'ADD A PROJECT TO START SCANNING' : 'NO RECORDS — RUN FIRST SCAN'}
                </div>
              ) : (
                filteredScans.map((scan, index) => (
                  <div key={scan.id} className={`scan-row ${scan.status === 'DRIFT_DETECTED' ? 'drift' : 'sync'}`} style={{ animationDelay: `${index * 0.05}s` }} onMouseEnter={() => setHoveredRow(scan.id)} onMouseLeave={() => setHoveredRow('')}>
                    <div style={{ width: '130px', flexShrink: 0 }}>
                      {scan.status === 'DRIFT_DETECTED'
                        ? <span className="badge-drift" style={{ boxShadow: hoveredRow === scan.id ? '0 0 12px #ff446640' : 'none' }}>✗ DRIFT</span>
                        : <span className="badge-sync" style={{ boxShadow: hoveredRow === scan.id ? '0 0 12px #00ff8840' : 'none' }}>✓ SYNC</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#d8e2f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{scan.terraform_dir}</div>
                      {index === 0 && !searchQuery && <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#00e5ff', marginTop: '4px', letterSpacing: '0.5px', textShadow: '0 0 8px #00e5ff60', fontWeight: 700 }}>← LATEST</div>}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: hoveredRow === scan.id ? '#b0bcd8' : '#7a8aaa', textAlign: 'right', flexShrink: 0, transition: 'color 0.2s', fontWeight: 600 }}>
                      <div>{new Date(scan.scanned_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                      <div style={{ fontSize: '10px', color: '#3a4a62', marginTop: '2px' }}>{getTimeSince(scan.scanned_at)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button className="diff-btn" onClick={() => setSelectedScan(scan)}>DIFF</button>
                      <button className="delete-btn" onClick={() => deleteScan(scan.id)} disabled={deletingId === scan.id} title="Delete">
                        {deletingId === scan.id ? '⟳' : '🗑'}
                      </button>
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