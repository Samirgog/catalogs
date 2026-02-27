import type { CatalogFormData, CatalogSubtype, CatalogType } from '@/types';

export type CatalogEditorFormData = {
  title: string;
  banner_url: string;
  address: string;
  subtype: CatalogSubtype;
  is_open_24_7: boolean;
  work_start: string;
  work_end: string;
  emergency_phone: string;
  emergency_telegram: string;
  is_active: boolean;
  type: CatalogType;
};

export const catalogOptions: Array<{
  value: CatalogType;
  title: string;
  description: string;
}> = [
  {
    value: 'goods',
    title: 'Товары',
    description: 'Продажа физических товаров',
  },
  {
    value: 'services',
    title: 'Услуги',
    description: 'Предоставление услуг с возможностью записаться',
  },
];

export const subtypeOptions: Record<
  CatalogType,
  Array<{
    value: CatalogSubtype;
    title: string;
    description: string;
  }>
> = {
  goods: [
    {
      value: 'shop',
      title: 'Магазин',
      description: 'Классические товары, витрина и корзина',
    },
    {
      value: 'cafe_restaurant',
      title: 'Кафе/Ресторан',
      description: 'Еда и напитки, поддержка выдачи к столику',
    },
    {
      value: 'digital_store',
      title: 'Цифровой магазин',
      description: 'Цифровые товары и доступы',
    },
  ],
  services: [
    {
      value: 'salon',
      title: 'Салон',
      description: 'Услуги в точке (beauty/wellness и т.п.)',
    },
    {
      value: 'private_master',
      title: 'Частный мастер',
      description: 'Выездные и локальные услуги частного специалиста',
    },
    {
      value: 'studio_club',
      title: 'Студия/Клуб (абонементы)',
      description: 'Услуги и абонементные форматы',
    },
  ],
};

export const createInitialCatalogForm = (): CatalogEditorFormData => ({
  title: '',
  banner_url: '',
  address: '',
  subtype: 'shop',
  is_open_24_7: false,
  work_start: '',
  work_end: '',
  emergency_phone: '',
  emergency_telegram: '',
  is_active: true,
  type: 'goods',
});

export const toShortAddress = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

export const buildCatalogPayload = (
  formData: CatalogEditorFormData
): CatalogFormData => ({
  title: formData.title.trim(),
  type: formData.type,
  subtype: formData.subtype,
  is_active: formData.is_active,
  banner_url: formData.banner_url,
  address: toShortAddress(formData.address.trim()),
  is_open_24_7: formData.is_open_24_7,
  work_start: formData.is_open_24_7 ? undefined : formData.work_start,
  work_end: formData.is_open_24_7 ? undefined : formData.work_end,
  emergency_phone: formData.emergency_phone.trim(),
  emergency_telegram: formData.emergency_telegram.trim(),
});

export const getSyncValidationError = (
  formData: CatalogEditorFormData,
  strictValidation: boolean
): string | null => {
  if (!formData.title.trim()) {
    return 'Заполните название каталога';
  }
  if (strictValidation && !formData.emergency_phone.trim()) {
    return 'Укажите номер телефона для связи';
  }
  if (strictValidation && !formData.emergency_telegram.trim()) {
    return 'Укажите Telegram контакт для связи';
  }
  if (
    strictValidation &&
    !formData.is_open_24_7 &&
    (!formData.work_start.trim() || !formData.work_end.trim())
  ) {
    return 'Укажите время работы "с" и "до" или включите "Круглосуточно"';
  }
  return null;
};
