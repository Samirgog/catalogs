import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  phone?: string | null;
  telegram?: string | null;
  telegramLink?: string;
  title: string;
  className?: string;
};

const normalizePhoneHref = (phone: string) =>
  `tel:${phone.replace(/[^\d+]/g, '')}`;

export function SellerContactsCard({
  phone,
  telegram,
  telegramLink,
  title,
  className,
}: Props) {
  if (!phone && !telegram) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {phone && (
          <p>
            Телефон:{' '}
            <a href={normalizePhoneHref(phone)} className="underline">
              {phone}
            </a>
          </p>
        )}
        {telegram && (
          <p>
            Telegram:{' '}
            {telegramLink ? (
              <a
                href={telegramLink}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {telegram}
              </a>
            ) : (
              <span>{telegram}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
