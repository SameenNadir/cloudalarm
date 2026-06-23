type Scan = {
  id: string;
  terraform_dir: string;
  status: string;
  message: string;
  scanned_at: string;
};

export default function DriftCard({ scan }: { scan: Scan }) {
  const isDrift = scan.status === 'DRIFT_DETECTED';

  const formattedDate = new Date(scan.scanned_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{
      background: '#0f0f1a',
      border: `1px solid ${isDrift ? '#f8717130' : '#22c55e30'}`,
      borderLeft: `3px solid ${isDrift ? '#f87171' : '#22c55e'}`,
      borderRadius: '12px', padding: '18px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{
            background: isDrift ? '#f8717120' : '#22c55e20',
            color: isDrift ? '#f87171' : '#22c55e',
            border: `1px solid ${isDrift ? '#f8717140' : '#22c55e40'}`,
            borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 700,
          }}>
            {isDrift ? '🚨 Drift Detected' : '✅ In Sync'}
          </span>
        </div>
        <p style={{ color: '#475569', fontSize: '12px', fontFamily: 'monospace', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📁 {scan.terraform_dir}
        </p>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{scan.message}</p>
      </div>
      <div style={{ color: '#334155', fontSize: '12px', whiteSpace: 'nowrap' }}>
        {formattedDate}
      </div>
    </div>
  );
}