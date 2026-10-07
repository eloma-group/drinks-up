import { Minus, Plus } from 'lucide-react';
import './QuantitySelector.css';

interface Props {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
  size?: 'sm' | 'md';
}

export function QuantitySelector({ value, onChange, min = 1, max = 24, label, size = 'md' }: Props) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, Number.isFinite(n) ? n : min)));
  return (
    <div className={`qty qty--${size}`} role="group" aria-label={label}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus size={size === 'sm' ? 14 : 16} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        aria-label="Quantity"
        onChange={(e) => set(parseInt(e.target.value, 10))}
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus size={size === 'sm' ? 14 : 16} />
      </button>
    </div>
  );
}
