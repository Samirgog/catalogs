import { ReceiptText } from 'lucide-react';

type Props = {
  count?: number;
  onClick: () => void;
  className?: string;
};

export function FloatingOrdersButton({ count, onClick, className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      className={`fixed right-4 z-50 h-14 rounded-[22px] border border-white/40 bg-white/72 px-4 text-foreground shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur-xl flex items-center gap-3 ${className}`}
      aria-label="Открыть заказы"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/12 text-primary">
        <ReceiptText size={18} />
      </div>
      <div className="text-left">
        <div className="text-[11px] leading-none text-muted-foreground">Ваши</div>
        <div className="text-sm font-semibold leading-tight">
          Заказы{typeof count === 'number' ? ` · ${count}` : ''}
        </div>
      </div>
    </button>
  );
}
