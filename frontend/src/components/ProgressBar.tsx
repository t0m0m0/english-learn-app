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

  const colorStyles = {
    blue: 'bg-gradient-to-r from-primary to-purple-500',
    green: 'bg-gradient-to-r from-success to-emerald-400',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-400',
  };

  return (
    <div className="mb-4">
      {label && (
        <span className="block text-sm text-text-secondary mb-2">{label}</span>
      )}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorStyles[color]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-sm">
        <span className="text-text-secondary">
          {current.toLocaleString()} / {total.toLocaleString()}
        </span>
        {showPercentage && (
          <span className="font-medium text-text-primary">{percentage}%</span>
        )}
      </div>
    </div>
  );
}

export default ProgressBar;
