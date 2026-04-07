import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useCatalog, useCatalogs } from '../hooks/useCatalogs';
import { useImagePreview } from '../hooks/useImages';
import { uploadImage } from '../services/images'; // Direct import for upload
import type { CatalogSubtype, Place } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useAddressSuggestions } from '@/hooks/useAddressSuggestions';
import { placesService } from '../services/places';
import { fulfillmentService } from '../services/fulfillment';
import { actionService } from '../services/actions';
import {
  buildCatalogPayload,
  createInitialCatalogForm,
  getSyncValidationError,
  toShortAddress,
} from './CatalogEditorPage/config';
import { NavActionButtons } from './CatalogEditorPage/components/NavActionButtons';
import { DangerZoneCard } from './CatalogEditorPage/components/DangerZoneCard';
import { BannerSection } from './CatalogEditorPage/components/BannerSection';
import { BasicSettingsSection } from './CatalogEditorPage/components/BasicSettingsSection';
import { TypeSubtypeSection } from './CatalogEditorPage/components/TypeSubtypeSection';
import { FoodcourtSection } from './CatalogEditorPage/components/FoodcourtSection';
import { TourOverlay } from '../tutorial/TourOverlay';
import { useSectionTutorial } from '../tutorial/useSectionTutorial';
import type { TutorialStep } from '../tutorial/types';
import { BusinessTutorialLauncher } from '../tutorial/BusinessTutorialLauncher';
import { showRequestError } from '../utils/request-feedback';

const catalogEditorTutorialSteps: TutorialStep[] = [
  {
    id: 'type',
    target: '[data-tour="catalog-editor-type-subtype"]',
    title: 'Тип и подтип бизнеса',
    description:
      'От выбора зависит логика оформления заказа и доступные способы получения.',
  },
  {
    id: 'banner',
    target: '[data-tour="catalog-editor-banner"]',
    title: 'Баннер каталога',
    description:
      'Загрузите изображение. Оно будет отображаться в шапке каталога у клиентов.',
  },
  {
    id: 'title',
    target: '[data-tour="catalog-editor-title"]',
    title: 'Название каталога',
    description:
      'Укажите понятное название, по которому вас смогут быстро найти.',
  },
  {
    id: 'actions',
    target: '[data-tour="catalog-editor-nav-actions"]',
    title: 'Переход к настройкам',
    description:
      'Здесь открываются категории, способы оплаты, выдачи, сотрудники и ссылки.',
  },
  {
    id: 'save',
    target: '[data-tour="catalog-editor-save"]',
    title: 'Сохранение',
    description:
      'Перед выходом из раздела нажмите «Сохранить», чтобы изменения не потерялись.',
  },
];

export function CatalogEditorPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  const isEditing = catalogId && catalogId !== 'new';

  // Enable auto back button for this page
  useAutoBackButton(`/catalogs`);

  // Use hooks for data management
  const {
    catalog: fetchedCatalog,
    loading: catalogLoading,
    error: catalogLoadError,
    refetch: refetchCatalog,
  } = useCatalog(
    catalogId && catalogId !== 'new' ? catalogId : ''
  );
  const { createCatalog, updateCatalog, deleteCatalog } = useCatalogs();

  // Image handling hooks
  const { generatePreview, previewUrl, clearPreview } = useImagePreview();

  // Loading state
  const isLoading = isEditing && catalogLoading;

  // Form state
  const draftKey = `catalog-editor-draft:${catalogId || 'new'}`;
  const [formData, setFormData] = useState(createInitialCatalogForm);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createdCatalogIdRef = useRef<string | null>(null);
  const hydratedFromDraftRef = useRef(false);
  const [foodcourtEnabled, setFoodcourtEnabled] = useState(false);
  const [foodcourtPlace, setFoodcourtPlace] = useState<Place | null>(null);
  const [foodcourtLoading, setFoodcourtLoading] = useState(false);
  const [foodcourtOptions, setFoodcourtOptions] = useState<Place[]>([]);
  const [selectedFoodcourtId, setSelectedFoodcourtId] = useState('');
  const [isSavingCatalog, setIsSavingCatalog] = useState(false);
  const [isDeletingCatalog, setIsDeletingCatalog] = useState(false);
  const [isBindingFoodcourt, setIsBindingFoodcourt] = useState(false);
  const addressSuggestions = useAddressSuggestions(formData.address);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const tutorial = useSectionTutorial(
    'catalog_editor',
    catalogEditorTutorialSteps,
    {
      enabled: !isLoading,
    }
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      setFormData(prev => ({ ...prev, ...parsed }));
      hydratedFromDraftRef.current = true;
    } catch {
      // ignore broken draft
    }
  }, [draftKey]);

  // Initialize form with fetched data
  useEffect(() => {
    if (fetchedCatalog && !hydratedFromDraftRef.current) {
      setFormData({
        title: fetchedCatalog.title,
        is_active: fetchedCatalog.is_active,
        banner_url: fetchedCatalog.banner_url || '',
        address: fetchedCatalog.address || '',
        subtype:
          fetchedCatalog.subtype ||
          (fetchedCatalog.type === 'goods' ? 'shop' : 'salon'),
        is_open_24_7: Boolean(fetchedCatalog.is_open_24_7),
        work_start: fetchedCatalog.work_start || '',
        work_end: fetchedCatalog.work_end || '',
        emergency_phone: fetchedCatalog.emergency_phone || '',
        emergency_telegram: fetchedCatalog.emergency_telegram || '',
        type: fetchedCatalog.type || 'goods',
      });
      setFoodcourtEnabled(false);
    }
  }, [fetchedCatalog]);

  useEffect(() => {
    const loadFoodcourtOptions = async () => {
      try {
        const options = await placesService.listFoodcourts();
        setFoodcourtOptions(options);
      } catch {
        setFoodcourtOptions([]);
      }
    };
    void loadFoodcourtOptions();
  }, []);

  useEffect(() => {
    const loadFoodcourt = async () => {
      if (!catalogId || !isEditing) return;
      try {
        setFoodcourtLoading(true);
        const place = await placesService.getFoodcourtForCatalog(catalogId);
        setFoodcourtPlace(place);
        setFoodcourtEnabled(Boolean(place));
        setSelectedFoodcourtId(place?.id ?? '');
      } catch {
        setFoodcourtPlace(null);
      } finally {
        setFoodcourtLoading(false);
      }
    };
    void loadFoodcourt();
  }, [catalogId, isEditing]);

  useEffect(() => {
    if (formData.type === 'goods' && formData.subtype === 'cafe_restaurant') {
      return;
    }
    setFoodcourtEnabled(false);
  }, [formData.subtype, formData.type]);

  useEffect(() => {
    sessionStorage.setItem(draftKey, JSON.stringify(formData));
  }, [draftKey, formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    await saveCatalog({ keepOnEditor: false, strictValidation: true });
  };

  useEffect(() => {
    const currentId = catalogId || createdCatalogIdRef.current;
    if (!currentId) return;
    localStorage.setItem('business-current-catalog-id', currentId);
  }, [catalogId]);

  const saveCatalog = async (options?: {
    keepOnEditor?: boolean;
    strictValidation?: boolean;
    silentSuccess?: boolean;
  }) => {
    const keepOnEditor = Boolean(options?.keepOnEditor);
    const strictValidation = options?.strictValidation ?? true;
    const silentSuccess = Boolean(options?.silentSuccess);
    if (isSavingCatalog) return '';
    try {
      setIsSavingCatalog(true);
      const syncValidationError = getSyncValidationError(
        formData,
        strictValidation
      );
      if (syncValidationError) {
        toast.error(syncValidationError);
        return;
      }

      if (strictValidation && formData.is_active && isEditing && catalogId) {
        const [methods, actions] = await Promise.all([
          fulfillmentService.getByCatalogId(catalogId),
          actionService.getByCatalogId(catalogId),
        ]);

        const hasEnabledMethod = methods.some(method => method.is_enabled);
        const hasEnabledAction = actions.some(action => action.is_enabled);

        if (!hasEnabledMethod) {
          toast.error('Настройте хотя бы один способ получения');
          return;
        }
        if (!hasEnabledAction) {
          toast.error('Настройте хотя бы один способ оплаты');
          return;
        }
      }

      const catalogData = buildCatalogPayload(formData);

      let savedCatalogId = catalogId || createdCatalogIdRef.current;

      if (savedCatalogId) {
        // Update existing catalog
        await updateCatalog(savedCatalogId, catalogData);
      } else {
        // Create new catalog
        const newCatalog = await createCatalog(catalogData);
        savedCatalogId = newCatalog.id;
        createdCatalogIdRef.current = newCatalog.id;
      }

      if (!silentSuccess) {
        toast.success('Каталог успешно сохранен');
      }
      sessionStorage.removeItem(draftKey);
      if (!isEditing && savedCatalogId && keepOnEditor) {
        navigate(`/catalogs/${savedCatalogId}/edit`, { replace: true });
      }
      return savedCatalogId || '';
    } catch (err) {
      console.error('Error saving catalog:', err);
      showRequestError(
        err instanceof Error
          ? err.message
          : 'Ошибка сохранения каталога. Попробуйте еще раз.',
        {
          retryLabel: 'Обновить',
          onRetry: () => window.location.reload(),
        }
      );
      return '';
    } finally {
      setIsSavingCatalog(false);
    }
  };

  const navigateWithSave = async (buildPath: (id: string) => string) => {
    if (isSavingCatalog) return;
    const savedCatalogId = await saveCatalog({
      keepOnEditor: true,
      strictValidation: false,
      silentSuccess: true,
    });
    if (!savedCatalogId) return;
    navigate(buildPath(savedCatalogId));
  };

  const handleConfigureCategories = () => {
    void navigateWithSave(id => `/categories/editor/${id}`);
  };

  const handleConfigureActions = () => {
    void navigateWithSave(id => `/actions/editor/${id}`);
  };

  const handleGenerateLink = () => {
    void navigateWithSave(id => `/catalogs/${id}/links`);
  };

  const handleConfigureStaff = () => {
    void navigateWithSave(id => `/staff/${id}`);
  };

  const handleConfigureAccess = () => {
    void navigateWithSave(id => `/catalogs/${id}/access`);
  };

  const handleConfigureFulfillment = () => {
    void navigateWithSave(id => `/catalogs/${id}/fulfillment`);
  };

  const handleDeleteCatalog = async () => {
    const targetId = catalogId || createdCatalogIdRef.current;
    if (!targetId) {
      toast.error('Каталог еще не создан');
      return;
    }
    if (!window.confirm('Удалить каталог полностью?')) return;

    try {
      setIsDeletingCatalog(true);
      await deleteCatalog(targetId);
      sessionStorage.removeItem(draftKey);
      toast.success('Каталог удален');
      navigate('/catalogs');
    } catch (err) {
      showRequestError(
        err instanceof Error ? err.message : 'Не удалось удалить каталог',
        {
          retryLabel: 'Обновить',
          onRetry: () => window.location.reload(),
        }
      );
    } finally {
      setIsDeletingCatalog(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Выберите файл изображения');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5 МБ');
        return;
      }

      try {
        // Create a safe filename using English transliteration
        const timestamp = Date.now();
        const safeFileName = `banner-${timestamp}-${uuidv4()}`;
        const uploadPath = `catalogs/${safeFileName}`;

        // First, generate immediate preview
        await generatePreview(file);

        // Then upload to Supabase storage (with fallback to base64)
        const imageUrl = await uploadImage(file, uploadPath);

        setFormData(prev => ({
          ...prev,
          banner_url: imageUrl,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Image processing failed. Please try again.';

        toast.error(errorMessage);
      }
    }
  };

  const handleRemoveImage = () => {
    clearPreview();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const updateFormData = (
    updater: (prev: typeof formData) => typeof formData
  ) => {
    setFormData(updater);
  };

  const handleFoodcourtToggle = async (checked: boolean) => {
    setFoodcourtEnabled(checked);
    if (!checked && catalogId && foodcourtPlace) {
      try {
        await placesService.detachFromFoodcourt(catalogId);
        setFoodcourtPlace(null);
        setSelectedFoodcourtId('');
        toast.success('Каталог откреплен от фудкорта');
      } catch {
        toast.error('Не удалось открепить каталог от фудкорта');
      }
    }
  };

  const handleAttachFoodcourt = async () => {
    if (!catalogId || !selectedFoodcourtId) return;
    try {
      setIsBindingFoodcourt(true);
      await placesService.attachToFoodcourt(catalogId, selectedFoodcourtId);
      const linked =
        foodcourtOptions.find(place => place.id === selectedFoodcourtId) ||
        null;
      setFoodcourtPlace(linked);
      toast.success('Фудкорт успешно привязан');
    } catch {
      toast.error('Не удалось привязать фудкорт');
    } finally {
      setIsBindingFoodcourt(false);
    }
  };

  const handleDetachFoodcourt = async () => {
    if (!catalogId) return;
    try {
      await placesService.detachFromFoodcourt(catalogId);
      setFoodcourtPlace(null);
      setSelectedFoodcourtId('');
      toast.success('Каталог откреплен от фудкорта');
    } catch {
      toast.error('Не удалось открепить каталог от фудкорта');
    }
  };

  const handleFoodcourtSupport = () => {
    const text = encodeURIComponent(
      `Здравствуйте! Не нашел фудкорт в списке.\nКаталог: ${formData.title || 'Без названия'}\nID: ${catalogId || 'new'}`
    );
    const supportUsername = (
      import.meta.env.VITE_SUPPORT_TELEGRAM || 'samir_gafaroff'
    ).replace('@', '');
    window.open(`https://t.me/${supportUsername}?text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (isEditing && catalogLoadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card max-w-md rounded-xl p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold">Не удалось загрузить каталог</h2>
          <p className="text-sm text-muted-foreground">{catalogLoadError}</p>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => void refetchCatalog()}>
              Повторить
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/catalogs')}
            >
              К списку
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing && !fetchedCatalog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card max-w-md rounded-xl p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold">Каталог не найден</h2>
          <p className="text-sm text-muted-foreground">
            Не удалось открыть каталог для редактирования.
          </p>
          <Button className="w-full" onClick={() => navigate('/catalogs')}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {isDeletingCatalog && (
        <div className="fixed inset-0 z-[90] bg-background/70 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-card p-4 flex items-center gap-2">
            <Spinner />
            <span>Удаляем каталог...</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Редактировать каталог' : 'Создать каталог'}
          </h1>
          <BusinessTutorialLauncher currentSection="catalog_editor" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <TypeSubtypeSection
          type={formData.type}
          subtype={formData.subtype}
          onTypeChange={value =>
            setFormData(prev => ({
              ...prev,
              type: value,
              subtype: (value === 'goods' ? 'shop' : 'salon') as CatalogSubtype,
            }))
          }
          onSubtypeChange={value =>
            setFormData(prev => ({ ...prev, subtype: value }))
          }
        />

        <div data-tour="catalog-editor-banner">
          <BannerSection
            bannerUrl={formData.banner_url}
            previewUrl={previewUrl}
            onRemove={handleRemoveImage}
            onTriggerUpload={triggerFileInput}
            onFileChange={handleImageChange}
            fileInputRef={fileInputRef}
          />
        </div>

        <BasicSettingsSection
          formData={formData}
          onFormChange={updateFormData}
          onInputChange={handleInputChange}
          showAddressSuggestions={showAddressSuggestions}
          setShowAddressSuggestions={setShowAddressSuggestions}
          addressOptions={addressSuggestions.suggestions}
          onAddressSelect={value =>
            setFormData(prev => ({
              ...prev,
              address: toShortAddress(value),
            }))
          }
        />

        {formData.type === 'goods' &&
          formData.subtype === 'cafe_restaurant' && (
            <FoodcourtSection
              enabled={foodcourtEnabled}
              loading={foodcourtLoading}
              selectedFoodcourtId={selectedFoodcourtId}
              foodcourtOptions={foodcourtOptions}
              currentFoodcourt={foodcourtPlace}
              isBindingFoodcourt={isBindingFoodcourt}
              canAttach={Boolean(catalogId && selectedFoodcourtId)}
              onEnabledChange={checked => {
                void handleFoodcourtToggle(checked);
              }}
              onSelectedFoodcourtChange={setSelectedFoodcourtId}
              onAttach={() => {
                void handleAttachFoodcourt();
              }}
              onDetach={() => {
                void handleDetachFoodcourt();
              }}
              onSupportClick={handleFoodcourtSupport}
            />
          )}

        <NavActionButtons
          isSavingCatalog={isSavingCatalog}
          onConfigureCategories={handleConfigureCategories}
          onConfigureActions={handleConfigureActions}
          onConfigureFulfillment={handleConfigureFulfillment}
          onGenerateLink={handleGenerateLink}
          onConfigureStaff={handleConfigureStaff}
          onConfigureAccess={handleConfigureAccess}
        />

        <DangerZoneCard
          isSavingCatalog={isSavingCatalog}
          onDelete={handleDeleteCatalog}
        />
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-6 left-4 right-4">
        <Button
          data-tour="catalog-editor-save"
          className="w-full h-14 text-base"
          onClick={handleSave}
          disabled={isSavingCatalog}
        >
          <Save className="w-5 h-5 mr-2" />
          {isSavingCatalog ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
      <TourOverlay
        open={tutorial.open}
        steps={catalogEditorTutorialSteps}
        sectionTitle="Редактор каталога"
        onClose={tutorial.closeAndMarkSeen}
        onComplete={tutorial.complete}
      />
    </div>
  );
}
