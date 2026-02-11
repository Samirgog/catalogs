import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useActions } from '../hooks/useActions';
import type { ActionType } from '../../types';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';

type CatalogType = 'products' | 'services';

const catalogOptions = [
  {
    value: 'products',
    title: 'Товары',
    description: 'Продажа физических товаров с возможностью оплаты через СБП или при получении'
  },
  {
    value: 'services',
    title: 'Услуги',
    description: 'Предоставление услуг с записью через Telegram'
  }
];

export function ActionsEditorPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  useAutoBackButton();
  
  // Get existing actions for this catalog
  const { actions, createAction, updateAction } = useActions(catalogId || '');
  
  const [catalogType, setCatalogType] = useState<CatalogType>('products');
  const [sbpEnabled, setSbpEnabled] = useState(false);
  const [onDeliveryEnabled, setOnDeliveryEnabled] = useState(false);
  const [sbpLink, setSbpLink] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // Load existing actions when component mounts
  useEffect(() => {
    if (actions.length > 0) {
      // Load existing configuration
      const orderAction = actions.find(a => a.type === 'order');
      const payAction = actions.find(a => a.type === 'pay');
      const bookAction = actions.find(a => a.type === 'book');
      const chatAction = actions.find(a => a.type === 'chat');
      
      // Set catalog type based on existing actions
      if (orderAction || payAction) {
        setCatalogType('products');
        setSbpEnabled(!!payAction?.is_enabled);
        setOnDeliveryEnabled(!!orderAction?.is_enabled);
        setSbpLink((payAction?.config?.sbp_link as string) || '');
      } else if (bookAction || chatAction) {
        setCatalogType('services');
        setContactInfo((bookAction?.config?.contact_info as string) || (chatAction?.config?.chat_link as string) || '');
      }
    }
  }, [actions]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = async () => {
    if (!catalogId) return;
    
    try {
      if (catalogType === 'products') {
        // Handle products actions
        const orderAction = actions.find(a => a.type === 'order');
        const payAction = actions.find(a => a.type === 'pay');
        
        // Create/update order action
        if (orderAction) {
          await updateAction(orderAction.id, {
            is_enabled: onDeliveryEnabled,
            config: { require_table_number: true }
          });
        } else {
          await createAction({
            type: 'order' as ActionType,
            is_enabled: onDeliveryEnabled,
            config: { require_table_number: true }
          });
        }
        
        // Create/update pay action
        if (payAction) {
          await updateAction(payAction.id, {
            is_enabled: sbpEnabled,
            config: { payment_method: 'sbp', sbp_link: sbpLink }
          });
        } else {
          await createAction({
            type: 'pay' as ActionType,
            is_enabled: sbpEnabled,
            config: { payment_method: 'sbp', sbp_link: sbpLink }
          });
        }
      } else {
        // Handle services actions
        const bookAction = actions.find(a => a.type === 'book');
        const chatAction = actions.find(a => a.type === 'chat');
        
        // Create/update book action
        if (bookAction) {
          await updateAction(bookAction.id, {
            is_enabled: true,
            config: { contact_method: 'telegram', contact_info: contactInfo }
          });
        } else {
          await createAction({
            type: 'book' as ActionType,
            is_enabled: true,
            config: { contact_method: 'telegram', contact_info: contactInfo }
          });
        }
        
        // Create/update chat action
        if (chatAction) {
          await updateAction(chatAction.id, {
            is_enabled: true,
            config: { chat_platform: 'telegram', chat_link: contactInfo }
          });
        } else {
          await createAction({
            type: 'chat' as ActionType,
            is_enabled: true,
            config: { chat_platform: 'telegram', chat_link: contactInfo }
          });
        }
      }
      
      // navigate('/catalogs');
    } catch (err) {
      console.error('Error saving actions:', err);
      // TODO: Show error to user
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 border-b bg-background">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Настройка действий</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Тип каталога</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={catalogType} onValueChange={(value: CatalogType) => setCatalogType(value)} className="space-y-4">
              {catalogOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {option.title}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>

            {catalogType === 'products' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sbp-toggle" className="text-base font-medium">
                    СБП (Система быстрых платежей)
                  </Label>
                  <Switch
                    id="sbp-toggle"
                    checked={sbpEnabled}
                    onCheckedChange={setSbpEnabled}
                  />
                </div>

                {sbpEnabled && (
                  <div>
                    <Label htmlFor="sbp-link">Ссылка для оплаты СБП</Label>
                    <Input
                      id="sbp-link"
                      value={sbpLink}
                      onChange={(e) => setSbpLink(e.target.value)}
                      placeholder="Введите ссылку для оплаты"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="delivery-toggle" className="text-base font-medium">
                    При получении
                  </Label>
                  <Switch
                    id="delivery-toggle"
                    checked={onDeliveryEnabled}
                    onCheckedChange={setOnDeliveryEnabled}
                  />
                </div>
              </div>
            )}

            {catalogType === 'services' && (
              <div className="pt-4 border-t">
                <Label htmlFor="contact-info">Ссылка на Telegram пользователя</Label>
                <Input
                  id="contact-info"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="@username или https://t.me/username"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 left-4 right-4 px-4">
        <Button 
          className="w-full h-14 text-lg" 
          onClick={handleSave}
        >
          <Save className="w-5 h-5 mr-2" />
          Сохранить
        </Button>
      </div>
    </div>
  );
}