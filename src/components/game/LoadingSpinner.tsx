import { ensureSpinnerStyles } from '../utils/styles';

export interface LoadingSpinnerProps {
  readonly size?: number;
  readonly color?: string;
}

export function LoadingSpinner({ size = 24, color = '#6366f1' }: LoadingSpinnerProps) {
  ensureSpinnerStyles();
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}20`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}
