import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import './Accordion.css';

interface Item {
  title: string;
  content: ReactNode;
}

export function Accordion({ items, defaultOpen = 0 }: { items: Item[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const id = useId();
  return (
    <div className="acc">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.title} className={`acc__item ${isOpen ? 'is-open' : ''}`}>
            <h3>
              <button
                type="button"
                className="acc__trigger"
                aria-expanded={isOpen}
                aria-controls={`${id}-${i}`}
                id={`${id}-t${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {it.title}
                <Plus className="acc__icon" size={20} aria-hidden="true" />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${id}-${i}`}
                  role="region"
                  aria-labelledby={`${id}-t${i}`}
                  className="acc__panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="acc__content">{it.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
