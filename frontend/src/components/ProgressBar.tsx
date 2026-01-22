import './ProgressBar.css';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'purple';
}

export function ProgressBar({
  current,
  total,
  label,
  showPercentage = true,
  color = 'blue',
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="progress-container">
      {label && <span className="progress-label">{label}</span>}
      <div className="progress-track">
        <div
          className={`progress-bar-fill ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="progress-info">
        <span className="progress-count">
          {current.toLocaleString()} / {total.toLocaleString()}
        </span>
        {showPercentage && (
          <span className="progress-percentage">{percentage}%</span>
        )}
      </div>
    </div>
  );
}

export default ProgressBar;
