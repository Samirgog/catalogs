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
      className={`fixed left-1/2 z-40 flex h-12 -translate-x-1/2 items-center gap-2 rounded-full border border-border/70 bg-background/92 px-4 text-foreground shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur ${className}`}
      aria-label="Открыть заказы"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ReceiptText size={16} />
      </div>
      <div className="text-sm font-semibold leading-none">
        Заказы
      </div>
      {typeof count === 'number' && count > 0 && (
        <div className="rounded-full bg-primary px-2 py-1 text-xs font-semibold leading-none text-primary-foreground">
          {count}
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        Открыть
      </div>
    </button>
  );
}
