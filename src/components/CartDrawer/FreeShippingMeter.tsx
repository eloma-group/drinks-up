import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { SITE } from '../../data/site';
import { money } from '../../utils/format';

export function FreeShippingMeter({ subtotal }: { subtotal: number }) {
  const goal = SITE.freeShippingThreshold;
  const pct = Math.min(1, subtotal / goal);
  const remaining = goal - subtotal;
  return (
    <div className="fsm">
      <p className="fsm__text">
        <Truck size={16} aria-hidden="true" />
        {remaining > 0 ? (
          <span>
            Spend <strong>{money(remaining)}</strong> more for free shipping in Australia
          </span>
        ) : (
          <span>
            <strong>Free shipping unlocked</strong> on your Australian order
          </span>
        )}
      </p>
      <div className="fsm__track" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.round(Math.min(subtotal, goal))} aria-label="Progress to free shipping">
        <motion.div className="fsm__fill" initial={false} animate={{ scaleX: pct }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  );
}
