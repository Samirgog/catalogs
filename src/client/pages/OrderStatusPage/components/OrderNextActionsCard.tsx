import { Clock3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClientActionOption } from '../../../utils/actionOptions';

type Props = {
  status: string;
  selectedAction: ClientActionOption | undefined;
};

export function OrderNextActionsCard({ status, selectedAction }: Props) {
  const show =
    ['created', 'submitted', 'payment_reported', 'new'].includes(status) &&
    Boolean(selectedAction);
  if (!show || !selectedAction) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="w-5 h-5" />
          Дальнейшие действия
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {selectedAction.kind === 'payment_on_delivery' && (
          <p>Оплата производится при получении.</p>
        )}
        {selectedAction.kind === 'payment_in_chat' && (
          <>
            <p>Свяжитесь с продавцом в Telegram для подтверждения оплаты.</p>
            {selectedAction.telegramUrl ? (
              <a
                href={selectedAction.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center px-4 rounded-xl bg-primary text-primary-foreground"
              >
                Открыть Telegram
              </a>
            ) : (
              <p>Ссылка Telegram не указана.</p>
            )}
          </>
        )}
        {selectedAction.kind === 'light_sbp' && (
          <>
            {selectedAction.details.bank && <p>Банк: {selectedAction.details.bank}</p>}
            {selectedAction.details.name && <p>Имя: {selectedAction.details.name}</p>}
            {selectedAction.details.phone && <p>Телефон: {selectedAction.details.phone}</p>}
            {selectedAction.details.sbp_link && (
              <a
                href={selectedAction.details.sbp_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center px-4 rounded-xl bg-primary text-primary-foreground"
              >
                Перейти к оплате СБП
              </a>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
