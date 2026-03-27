import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Suggestion = {
  value: string;
  label: string;
};

type Props = {
  title: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  placeholder?: string;
};

export function AddressFieldCard({
  title,
  value,
  onChange,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  placeholder = 'Введите адрес',
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Input
            value={value}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
              {suggestions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className="w-full border-b border-border/40 px-3 py-3 text-left text-sm last:border-b-0 hover:bg-secondary/60"
                  onClick={() => {
                    onChange(option.value);
                    setShowSuggestions(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
