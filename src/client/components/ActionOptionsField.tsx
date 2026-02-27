import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ClientActionOption } from '../utils/actionOptions';

type Props = {
  options: ClientActionOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  idPrefix: string;
  emptyText: string;
  paymentPurpose: string;
  title?: string;
};

export function ActionOptionsField({
  options,
  selectedValue,
  onChange,
  idPrefix,
  emptyText,
  paymentPurpose,
  title = 'Способ оформления',
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <RadioGroup value={selectedValue} onValueChange={onChange} className="space-y-3">
            {options.map((option) => (
              <Label
                key={option.id}
                htmlFor={`${idPrefix}-action-${option.id}`}
                className={`block w-full rounded-xl p-4 glass-card cursor-pointer ${
                  selectedValue === option.id ? 'ring-2 ring-primary' : 'ring-0'
                }`}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    id={`${idPrefix}-action-${option.id}`}
                    value={option.id}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                    {selectedValue === option.id && option.kind === 'light_sbp' && (
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        {option.details.bank && <p>Банк: {option.details.bank}</p>}
                        {option.details.name && <p>Имя: {option.details.name}</p>}
                        {option.details.phone && <p>Телефон: {option.details.phone}</p>}
                        {option.details.sbp_link && (
                          <p className="break-all">Ссылка СБП: {option.details.sbp_link}</p>
                        )}
                        <p className="font-medium text-foreground">
                          Назначение платежа: {paymentPurpose}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Label>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
