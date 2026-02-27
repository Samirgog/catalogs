import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

type Props = {
  isSavingCatalog: boolean;
  onDelete: () => void;
};

export function DangerZoneCard({ isSavingCatalog, onDelete }: Props) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-destructive">Опасная зона</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          className="w-full h-12 justify-start"
          onClick={onDelete}
          disabled={isSavingCatalog}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Удалить каталог
        </Button>
      </CardContent>
    </Card>
  );
}
