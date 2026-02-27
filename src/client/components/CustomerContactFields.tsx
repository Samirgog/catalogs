import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  idPrefix: string;
  customerName: string;
  customerPhone: string;
  customerComment: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCommentChange: (value: string) => void;
  commentPlaceholder: string;
};

export function CustomerContactFields({
  idPrefix,
  customerName,
  customerPhone,
  customerComment,
  onNameChange,
  onPhoneChange,
  onCommentChange,
  commentPlaceholder,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`${idPrefix}-name`} className="block mb-2">
          Имя
        </Label>
        <Input
          id={`${idPrefix}-name`}
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ваше имя"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-phone`} className="block mb-2">
          Телефон
        </Label>
        <Input
          id={`${idPrefix}-phone`}
          value={customerPhone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+7 900 000-00-00"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-comment`} className="block mb-2">
          Комментарий
        </Label>
        <Textarea
          id={`${idPrefix}-comment`}
          value={customerComment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder={commentPlaceholder}
        />
      </div>
    </div>
  );
}
