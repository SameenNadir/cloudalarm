// StatusBadge.tsx — Shows a colored badge based on drift status
// Green = IN_SYNC, Red = DRIFT_DETECTED, Yellow = ERROR

type Props = {
  status: 'IN_SYNC' | 'DRIFT_DETECTED' | 'ERROR' | string;
};

export default function StatusBadge({ status }: Props) {
  const styles = {
    IN_SYNC: 'bg-green-500/20 text-green-400 border border-green-500/30',
    DRIFT_DETECTED: 'bg-red-500/20 text-red-400 border border-red-500/30',
    ERROR: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  };

  const labels = {
    IN_SYNC: '✅ In Sync',
    DRIFT_DETECTED: '🚨 Drift Detected',
    ERROR: '⚠️ Error',
  };

  const style = styles[status as keyof typeof styles] || styles.ERROR;
  const label = labels[status as keyof typeof labels] || status;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
      {label}
    </span>
  );
}