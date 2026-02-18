import { useMemo, useState } from 'react';
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

type ActionsFormState = {
  paymentOnDeliveryEnabled: boolean;
  telegramContactEnabled: boolean;
  telegramUrl: string;
  sbpEnabled: boolean;
  sbpBank: string;
  sbpName: string;
  sbpPhone: string;
  sbpLink: string;
};

const DELIVERY_TYPES: ActionType[] = ['order'];
const TELEGRAM_TYPES: ActionType[] = ['chat', 'book'];
const SBP_TYPES: ActionType[] = ['pay'];

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

const mapActionsToFormState = (actions: Action[]): ActionsFormState => {
  const deliveryAction = findByTypes(actions, DELIVERY_TYPES);
  const telegramAction = findByTypes(actions, TELEGRAM_TYPES);
  const sbpAction = findByTypes(actions, SBP_TYPES);

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
  };
};

export function ActionsEditorPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  useAutoBackButton();

  const { actions, createAction, updateAction, loading, error } = useActions(
    catalogId || ''
  );
  const [draft, setDraft] = useState<ActionsFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const initialState = useMemo(() => mapActionsToFormState(actions), [actions]);
  const formState = draft ?? initialState;

  const patchFormState = (patch: Partial<ActionsFormState>) => {
    setDraft(prev => ({
      ...(prev ?? initialState),
      ...patch,
    }));
  };

  const upsertAction = async (
    existingTypes: readonly ActionType[],
    nextType: ActionType,
    isEnabled: boolean,
    config: Record<string, unknown>
  ) => {
    const existingAction = findByTypes(actions, existingTypes);

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
      setSaveError(null);
      setSaveSuccess(null);

      await Promise.all([
        upsertAction(
          DELIVERY_TYPES,
          'order',
          formState.paymentOnDeliveryEnabled,
          { paymentType: 'payment_on_delivery' }
        ),
        upsertAction(TELEGRAM_TYPES, 'chat', formState.telegramContactEnabled, {
          paymentType: 'payment_in_chat',
          telegramUrl: formState.telegramUrl.trim(),
        }),
        upsertAction(SBP_TYPES, 'pay', formState.sbpEnabled, {
          paymentType: 'light_sbp',
          details: {
            bank: formState.sbpBank.trim(),
            name: formState.sbpName.trim(),
            phone: formState.sbpPhone.trim(),
            sbp_link: formState.sbpLink.trim(),
          },
        }),
      ]);

      setSaveSuccess('Изменения сохранены');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось сохранить действия';
      setSaveError(message);
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
        <h1 className="text-2xl font-bold">
          Настройка способов оплаты и действий
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="glass-card p-3 text-sm text-red-600">{error}</div>
        )}
        {saveError && (
          <div className="glass-card p-3 text-sm text-red-600">{saveError}</div>
        )}
        {saveSuccess && (
          <div className="glass-card p-3 text-sm text-green-600">
            {saveSuccess}
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
                placeholder="https://t.me/username"
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>Упрощенная оплата по СБП</span>
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
                Ваши клиенты смогут совершить оплату по введенным вами данным
                СБП, вы можете указать номер телефона для перевода, либо указать
                прямую ссылку СБП на ваш счет.
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
