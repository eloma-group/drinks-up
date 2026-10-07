import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './Button.css';

type Variant = 'ink' | 'coral' | 'outline' | 'light' | 'ghost';
type Size = 'md' | 'lg' | 'sm';

interface Common {
  variant?: Variant;
  size?: Size;
  /** Show the arrow chip that slides on hover */
  arrow?: boolean;
  icon?: ReactNode;
  block?: boolean;
  className?: string;
  children: ReactNode;
}

type AsLink = Common & { to: string; href?: never; onClick?: () => void };
type AsAnchor = Common & { href: string; to?: never; external?: boolean };
type AsButton = Common & { to?: never; href?: never } & ButtonHTMLAttributes<HTMLButtonElement>;

const cls = ({ variant = 'ink', size = 'md', block, className, arrow }: Common) =>
  ['btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', arrow && 'btn--arrow', className].filter(Boolean).join(' ');

function Inner({ children, arrow, icon }: Pick<Common, 'children' | 'arrow' | 'icon'>) {
  return (
    <>
      {icon && <span className="btn__icon" aria-hidden="true">{icon}</span>}
      <span className="btn__label">
        <span className="btn__text" data-text={typeof children === 'string' ? children : undefined}>
          {children}
        </span>
      </span>
      {arrow && (
        <span className="btn__chip" aria-hidden="true">
          <ArrowUpRight size={16} strokeWidth={2.25} />
          <ArrowUpRight size={16} strokeWidth={2.25} />
        </span>
      )}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, AsLink | AsAnchor | AsButton>(function Button(props, ref) {
  const { variant, size, arrow, icon, block, className, children, ...rest } = props as Common & Record<string, unknown>;
  const c = cls({ variant, size, block, className, arrow, children });
  if ('to' in props && props.to) {
    return (
      <Link ref={ref as Ref<HTMLAnchorElement>} to={props.to} className={c} onClick={props.onClick}>
        <Inner arrow={arrow} icon={icon}>{children}</Inner>
      </Link>
    );
  }
  if ('href' in props && props.href) {
    const ext = (props as AsAnchor).external;
    return (
      <a ref={ref as Ref<HTMLAnchorElement>} href={props.href} className={c} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        <Inner arrow={arrow} icon={icon}>{children}</Inner>
      </a>
    );
  }
  const { type = 'button', external: _e, ...btn } = rest as ButtonHTMLAttributes<HTMLButtonElement> & { external?: boolean };
  void _e;
  return (
    <button ref={ref as Ref<HTMLButtonElement>} type={type} className={c} {...btn}>
      <Inner arrow={arrow} icon={icon}>{children}</Inner>
    </button>
  );
});
