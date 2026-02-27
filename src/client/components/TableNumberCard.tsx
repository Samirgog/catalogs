import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  placeholder?: string;
};

export function TableNumberCard({
  value,
  onChange,
  title = 'Номер столика',
  placeholder = 'Например, 12',
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </CardContent>
    </Card>
  );
}
