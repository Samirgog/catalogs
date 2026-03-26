import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { useActions } from '../hooks/useActions';
import type { Action, ActionType } from '../../types';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { usePaymentGateway } from '../hooks/usePaymentGateway';
import { showRequestError } from '../utils/request-feedback';

type ActionsFormState = {
  paymentOnDeliveryEnabled: boolean;
  telegramContactEnabled: boolean;
  telegramUrl: string;
  sbpEnabled: boolean;
  sbpBank: string;
  sbpName: string;
  sbpPhone: string;
  sbpLink: string;
  yookassaEnabled: boolean;
  yookassaShopId: string;
  yookassaSecretKey: string;
};

const DELIVERY_TYPES: ActionType[] = ['order'];
const TELEGRAM_TYPES: ActionType[] = ['chat', 'book'];
const getString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const asConfig = (action?: Action): Record<string, unknown> => {
  if (!action || !action.config || typeof action.config !== 'object') {
    return {};
  }
  return action.config;
};

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return value as Record<string, unknown>;
};

const findByTypes = (
  actions: Action[],
  types: readonly ActionType[]
): Action | undefined => {
  for (const type of types) {
    const match = actions.find(action => action.type === type);
    if (match) return match;
  }
  return undefined;
};

const findByPaymentType = (actions: Action[], paymentType: string) =>
  actions.find(
    (action) =>
      action.type === 'pay' &&
      getString(asConfig(action).paymentType) === paymentType
  );

const mapActionsToFormState = (
  actions: Action[],
  gateway?: {
    is_enabled: boolean;
    shop_id: string;
    secret_key: string;
  } | null
): ActionsFormState => {
  const deliveryAction = findByTypes(actions, DELIVERY_TYPES);
  const telegramAction = findByTypes(actions, TELEGRAM_TYPES);
  const sbpAction = findByPaymentType(actions, 'light_sbp');
  const yookassaAction = findByPaymentType(actions, 'online_yookassa');

  const telegramConfig = asConfig(telegramAction);
  const sbpConfig = asConfig(sbpAction);
  const sbpDetails = asObject(sbpConfig.details);

  return {
    paymentOnDeliveryEnabled: Boolean(deliveryAction?.is_enabled),
    telegramContactEnabled: Boolean(telegramAction?.is_enabled),
    telegramUrl:
      getString(telegramConfig.telegramUrl) ||
      getString(telegramConfig.telegram_url) ||
      getString(telegramConfig.chat_link) ||
      getString(telegramConfig.contact_info),
    sbpEnabled: Boolean(sbpAction?.is_enabled),
    sbpBank:
      getString(sbpDetails.bank) ||
      getString(sbpConfig.bank) ||
      getString(sbpConfig.sbp_bank),
    sbpName:
      getString(sbpDetails.name) ||
      getString(sbpConfig.name) ||
      getString(sbpConfig.full_name),
    sbpPhone:
      getString(sbpDetails.phone) ||
      getString(sbpConfig.phone) ||
      getString(sbpConfig.phone_number),
    sbpLink:
      getString(sbpDetails.sbp_link) ||
      getString(sbpConfig.sbp_link) ||
      getString(sbpConfig.link),
    yookassaEnabled: gateway?.is_enabled ?? Boolean(yookassaAction?.is_enabled),
    yookassaShopId: gateway?.shop_id ?? '',
    yookassaSecretKey: gateway?.secret_key ?? '',
  };
};

export function ActionsEditorPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  useAutoBackButton();

  const { actions, createAction, updateAction, loading, error } = useActions(
    catalogId || ''
  );
  const { gateway, saveGateway, loading: gatewayLoading } = usePaymentGateway(
    catalogId || ''
  );
  const [draft, setDraft] = useState<ActionsFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const initialState = useMemo(
    () => mapActionsToFormState(actions, gateway),
    [actions, gateway]
  );
  const formState = draft ?? initialState;

  useEffect(() => {
    if (!error) return;
    showRequestError(error, {
      onRetry: () => window.location.reload(),
      retryLabel: 'Обновить',
    });
  }, [error]);

  const patchFormState = (patch: Partial<ActionsFormState>) => {
    setDraft(prev => ({
      ...(prev ?? initialState),
      ...patch,
    }));
  };

  const upsertAction = async (
    existingAction: Action | undefined,
    nextType: ActionType,
    isEnabled: boolean,
    config: Record<string, unknown>
  ) => {
    if (existingAction) {
      await updateAction(existingAction.id, {
        type: nextType,
        is_enabled: isEnabled,
        config,
      });
      return;
    }

    await createAction({
      type: nextType,
      is_enabled: isEnabled,
      config,
    });
  };

  const handleSave = async () => {
    if (!catalogId) return;

    try {
      setIsSaving(true);
      if (
        !formState.paymentOnDeliveryEnabled &&
        !formState.telegramContactEnabled &&
        !formState.sbpEnabled &&
        !formState.yookassaEnabled
      ) {
        toast.error('Нужно включить хотя бы один способ оплаты');
        return;
      }

      if (
        formState.yookassaEnabled &&
        (!formState.yookassaShopId.trim() || !formState.yookassaSecretKey.trim())
      ) {
        toast.error('Для ЮKassa заполните shopId и secret key');
        return;
      }

      await Promise.all([
        upsertAction(
          findByTypes(actions, DELIVERY_TYPES),
          'order',
          formState.paymentOnDeliveryEnabled,
          { paymentType: 'payment_on_delivery' }
        ),
        upsertAction(findByTypes(actions, TELEGRAM_TYPES), 'chat', formState.telegramContactEnabled, {
          paymentType: 'payment_in_chat',
          telegramUrl: formState.telegramUrl.trim(),
        }),
        upsertAction(findByPaymentType(actions, 'light_sbp'), 'pay', formState.sbpEnabled, {
          paymentType: 'light_sbp',
          details: {
            bank: formState.sbpBank.trim(),
            name: formState.sbpName.trim(),
            phone: formState.sbpPhone.trim(),
            sbp_link: formState.sbpLink.trim(),
          },
        }),
        upsertAction(findByPaymentType(actions, 'online_yookassa'), 'pay', formState.yookassaEnabled, {
          paymentType: 'online_yookassa',
          provider: 'yookassa',
          label: 'Онлайн-оплата картой / СБП',
        }),
      ]);

      if (formState.yookassaEnabled) {
        await saveGateway({
          provider: 'yookassa',
          is_enabled: true,
          shop_id: formState.yookassaShopId.trim(),
          secret_key: formState.yookassaSecretKey.trim(),
        });
      } else if (gateway) {
        await saveGateway({
          provider: 'yookassa',
          is_enabled: false,
          shop_id: formState.yookassaShopId.trim() || gateway.shop_id,
          secret_key: formState.yookassaSecretKey.trim() || gateway.secret_key,
        });
      }

      toast.success('Изменения сохранены');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось сохранить действия';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!catalogId) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="glass-card p-4">
          Ошибка: не найден идентификатор каталога.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">
            Настройка способов оплаты и действий
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {(loading || gatewayLoading) && actions.length === 0 && (
          <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="glass-card p-4 flex items-center gap-2">
              <Spinner />
              <span>Загрузка...</span>
            </div>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>Оплата при получении</span>
              <Switch
                checked={formState.paymentOnDeliveryEnabled}
                onCheckedChange={checked =>
                  patchFormState({ paymentOnDeliveryEnabled: checked })
                }
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Клиент оплачивает заказ при получении.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>Связаться с продавцом в Telegram</span>
              <Switch
                checked={formState.telegramContactEnabled}
                onCheckedChange={checked =>
                  patchFormState({ telegramContactEnabled: checked })
                }
              />
            </CardTitle>
          </CardHeader>
          {formState.telegramContactEnabled && (
            <CardContent>
              <Label htmlFor="telegram-url" className="block mb-2">
                Ссылка на аккаунт Telegram
              </Label>
              <Input
                id="telegram-url"
                value={formState.telegramUrl}
                onChange={e => patchFormState({ telegramUrl: e.target.value })}
                placeholder="@username или https://t.me/username"
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>Переводом</span>
              <Switch
                checked={formState.sbpEnabled}
                onCheckedChange={checked =>
                  patchFormState({ sbpEnabled: checked })
                }
              />
            </CardTitle>
          </CardHeader>
          {formState.sbpEnabled && (
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Клиенты смогут оплатить переводом по указанным вами реквизитам:
                по номеру телефона или по прямой ссылке СБП.
              </p>

              <div>
                <Label htmlFor="sbp-bank" className="block mb-2">
                  Банк
                </Label>
                <Input
                  id="sbp-bank"
                  value={formState.sbpBank}
                  onChange={e => patchFormState({ sbpBank: e.target.value })}
                  placeholder="Например: Т-Банк"
                />
              </div>

              <div>
                <Label htmlFor="sbp-name" className="block mb-2">
                  Имя
                </Label>
                <Input
                  id="sbp-name"
                  value={formState.sbpName}
                  onChange={e => patchFormState({ sbpName: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <Label htmlFor="sbp-phone" className="block mb-2">
                  Номер телефона
                </Label>
                <Input
                  id="sbp-phone"
                  value={formState.sbpPhone}
                  onChange={e => patchFormState({ sbpPhone: e.target.value })}
                  placeholder="+7 900 000-00-00"
                />
              </div>

              <div>
                <Label htmlFor="sbp-link" className="block mb-2">
                  Ссылка СБП
                </Label>
                <Input
                  id="sbp-link"
                  value={formState.sbpLink}
                  onChange={e => patchFormState({ sbpLink: e.target.value })}
                  placeholder="https://qr.nspk.ru/..."
                />
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>Онлайн-оплата через ЮKassa</span>
              <Switch
                checked={formState.yookassaEnabled}
                onCheckedChange={(checked) =>
                  patchFormState({ yookassaEnabled: checked })
                }
              />
            </CardTitle>
          </CardHeader>
          {formState.yookassaEnabled && (
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Клиент сможет оплатить заказ банковской картой, через SberPay и
                доступные онлайн-способы оплаты ЮKassa.
              </p>
              <div>
                <Label htmlFor="yookassa-shop-id" className="block mb-2">
                  Shop ID
                </Label>
                <Input
                  id="yookassa-shop-id"
                  value={formState.yookassaShopId}
                  onChange={(e) =>
                    patchFormState({ yookassaShopId: e.target.value })
                  }
                  placeholder="123456"
                />
              </div>
              <div>
                <Label htmlFor="yookassa-secret-key" className="block mb-2">
                  Secret key
                </Label>
                <Input
                  id="yookassa-secret-key"
                  type="password"
                  value={formState.yookassaSecretKey}
                  onChange={(e) =>
                    patchFormState({ yookassaSecretKey: e.target.value })
                  }
                  placeholder="live_xxxxxxxxxxxxx"
                />
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <div className="fixed bottom-6 left-4 right-4">
        <Button
          className="w-full h-14 text-base"
          onClick={handleSave}
          disabled={loading || isSaving}
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
}
