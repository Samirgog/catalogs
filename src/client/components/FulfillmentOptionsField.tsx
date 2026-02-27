import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FulfillmentMethodType } from '@/types';

type FulfillmentCopy = {
  title: string;
  description: string;
};

type FulfillmentCopyMap = Partial<Record<FulfillmentMethodType, FulfillmentCopy>>;

type Props = {
  options: FulfillmentMethodType[];
  selected: FulfillmentMethodType;
  onChange: (value: FulfillmentMethodType) => void;
  title?: string;
  className?: string;
  copy: FulfillmentCopyMap;
};

const orderedOptions: FulfillmentMethodType[] = [
  'pickup',
  'delivery',
  'digital',
  'to_table',
  'on_site',
  'at_client',
];

export function FulfillmentOptionsField({
  options,
  selected,
  onChange,
  title = 'Способ получения',
  className,
  copy,
}: Props) {
  if (options.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selected}
          onValueChange={(value) => onChange(value as FulfillmentMethodType)}
          className="space-y-3"
        >
          {orderedOptions
            .filter((option) => options.includes(option))
            .map((option) => {
              const optionCopy = copy[option];
              if (!optionCopy) return null;
              return (
                <Label
                  key={option}
                  className="block w-full rounded-xl p-4 glass-card cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={option} className="mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">{optionCopy.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {optionCopy.description}
                      </p>
                    </div>
                  </div>
                </Label>
              );
            })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
