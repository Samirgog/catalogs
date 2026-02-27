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
        <div className="relative">
          <Input
            value={value}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-[80] mt-1 w-full rounded-xl border bg-background shadow-lg overflow-hidden">
              {suggestions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60"
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
