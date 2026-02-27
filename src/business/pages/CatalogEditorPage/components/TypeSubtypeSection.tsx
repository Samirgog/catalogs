import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { CatalogSubtype, CatalogType } from '@/types';
import { catalogOptions, subtypeOptions } from '../config';

type Props = {
  type: CatalogType;
  subtype: CatalogSubtype;
  onTypeChange: (value: CatalogType) => void;
  onSubtypeChange: (value: CatalogSubtype) => void;
};

export function TypeSubtypeSection({
  type,
  subtype,
  onTypeChange,
  onSubtypeChange,
}: Props) {
  return (
    <Card data-tour="catalog-editor-type-subtype">
      <CardHeader>
        <CardTitle>Тип и подтип</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={type}
          onValueChange={(value: CatalogType) => onTypeChange(value)}
          className="space-y-3"
        >
          {catalogOptions.map((option) => (
            <div key={option.value} className="flex items-start gap-3 p-4 glass-card">
              <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={option.value} className="text-base font-medium leading-none">
                  {option.title}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>

        <div className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">Подтип</p>
          <RadioGroup
            value={subtype}
            onValueChange={(value: CatalogSubtype) => onSubtypeChange(value)}
            className="space-y-2"
          >
            {subtypeOptions[type].map((option) => (
              <div key={option.value} className="flex items-start gap-3 p-3 glass-card rounded-xl">
                <RadioGroupItem
                  value={option.value}
                  id={`subtype-${option.value}`}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`subtype-${option.value}`}
                    className="text-sm font-medium leading-none"
                  >
                    {option.title}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
