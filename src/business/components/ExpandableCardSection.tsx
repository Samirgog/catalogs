import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  canLoadMore?: boolean;
  onLoadMore?: () => void;
  loadMoreLabel?: string;
};

export function ExpandableCardSection({
  title,
  expanded,
  onToggle,
  children,
  canLoadMore = false,
  onLoadMore,
  loadMoreLabel = 'Показать еще',
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {expanded ? (
            <>
              Свернуть <ChevronUp className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              Развернуть <ChevronDown className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3">
          {children}
          {canLoadMore && onLoadMore && (
            <Button variant="outline" className="w-full" onClick={onLoadMore}>
              {loadMoreLabel}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
