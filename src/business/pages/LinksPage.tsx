import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Download, Share2, QrCode, AlertCircle } from 'lucide-react';
import { useQRLinks } from '../hooks/useQR';
import { catalogService } from '../services/catalogs';
import type { QRLink, Catalog } from '@/types';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useSectionTutorial } from '../tutorial/useSectionTutorial';
import { TourOverlay } from '../tutorial/TourOverlay';
import type { TutorialStep } from '../tutorial/types';
import { BusinessTutorialLauncher } from '../tutorial/BusinessTutorialLauncher';
import { showRequestError } from '../utils/request-feedback';

const linksTutorialSteps: TutorialStep[] = [
  {
    id: 'qr',
    target: '[data-tour="links-qr-card"]',
    title: 'QR-код каталога',
    description: 'Клиенты могут открыть каталог сканированием этого QR-кода.',
  },
  {
    id: 'tables',
    target: '[data-tour="links-table-qr"]',
    title: 'QR для столиков',
    description:
      'Для кафе и ресторанов можно сгенерировать отдельные QR-коды по номерам столиков.',
  },
  {
    id: 'link',
    target: '[data-tour="links-direct-link"]',
    title: 'Прямая ссылка',
    description:
      'Скопируйте ссылку и отправьте ее клиенту в мессенджере или соцсетях.',
  },
];

let qrCodeModulePromise: Promise<typeof import('qrcode')> | null = null;
let jsPdfModulePromise: Promise<typeof import('jspdf')> | null = null;

const loadQrCodeModule = () => {
  if (!qrCodeModulePromise) {
    qrCodeModulePromise = import('qrcode');
  }
  return qrCodeModulePromise;
};

const loadJsPdfModule = () => {
  if (!jsPdfModulePromise) {
    jsPdfModulePromise = import('jspdf');
  }
  return jsPdfModulePromise;
};

interface LinkData {
  url: string;
  qrCodeDataUrl: string;
  catalogTitle: string;
  qrLink: QRLink;
}

export function LinksPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  useAutoBackButton();

  // Use QR hook
  const {
    qrLinks,
    loading: qrLoading,
    error: qrError,
    generateQRForCatalog,
  } = useQRLinks(catalogId || '');

  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  // const [copySuccess, setCopySuccess] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [tablesCount, setTablesCount] = useState('10');
  const clientBotUsername = (
    import.meta.env.VITE_CLIENT_BOT_USERNAME || 'v_click_bot'
  ).replace('@', '');
  const clientBotAppShortName =
    import.meta.env.VITE_CLIENT_BOT_APP_SHORT_NAME || 'vclickapp';
  const buildClientMiniAppLink = (payload: string, table?: number) => {
    const startParam = table ? `${payload}__table_${table}` : payload;
    if (clientBotAppShortName) {
      return `https://t.me/${clientBotUsername}/${clientBotAppShortName}?startapp=${encodeURIComponent(startParam)}`;
    }
    return `https://t.me/${clientBotUsername}?startapp=${encodeURIComponent(startParam)}`;
  };
  const tutorial = useSectionTutorial('links', linksTutorialSteps, {
    enabled: !isGenerating && !qrLoading && Boolean(linkData),
  });
  const [hasShownCatalogErrorToast, setHasShownCatalogErrorToast] = useState(false);
  const [hasShownQrErrorToast, setHasShownQrErrorToast] = useState(false);

  useEffect(() => {
    if (!catalogId) return;
    localStorage.setItem('business-current-catalog-id', catalogId);
  }, [catalogId]);

  const saveBlobToDevice = async (
    blob: Blob,
    fileName: string,
    successText: string
  ) => {
    const file = new File([blob], fileName, {
      type: blob.type || 'application/octet-stream',
    });

    try {
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: fileName,
        });
        toast.success(successText);
        return;
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Share failed, trying download fallback', error);
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    toast.success(successText);
  };

  useEffect(() => {
    if (catalogError && !hasShownCatalogErrorToast) {
      showRequestError(catalogError, {
        retryLabel: 'Обновить',
        onRetry: () => window.location.reload(),
        id: 'links-catalog-error',
      });
      setHasShownCatalogErrorToast(true);
    }
    if (!catalogError) {
      setHasShownCatalogErrorToast(false);
    }
  }, [catalogError, hasShownCatalogErrorToast]);

  useEffect(() => {
    if (qrError && !hasShownQrErrorToast) {
      showRequestError(qrError, {
        retryLabel: 'Обновить',
        onRetry: () => window.location.reload(),
        id: 'links-qr-error',
      });
      setHasShownQrErrorToast(true);
    }
    if (!qrError) {
      setHasShownQrErrorToast(false);
    }
  }, [qrError, hasShownQrErrorToast]);

  // Fetch catalog data
  useEffect(() => {
    const fetchCatalog = async () => {
      if (!catalogId) return;

      try {
        const catalogData = await catalogService.getById(catalogId);
        setCatalog(catalogData);
        if (!catalogData) {
          setCatalogError('Каталог не найден');
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
        setCatalogError('Ошибка загрузки каталога');
      }
    };

    void fetchCatalog();
  }, [catalogId]);

  // Generate or fetch QR code when catalog and QR links change
  useEffect(() => {
    let isMounted = true;

    const handleQRGeneration = async () => {
      if (!catalogId || !catalog || qrLoading || !isMounted || catalogError || qrError) return;

      // Check if we already have link data for this catalog
      if (linkData && linkData.qrLink.target_id === catalogId) {
        return;
      }

      setIsGenerating(true);
      setCatalogError(null);

      try {
        let qrLink: QRLink;

        // Check if QR code already exists
        if (qrLinks && qrLinks.length > 0) {
          // Use existing QR code
          qrLink = qrLinks[0];
        } else {
          // Generate new QR code
          const slug = `catalog_${catalogId}`;
          qrLink = await generateQRForCatalog(slug);
        }

        // Generate QR code image
        const catalogUrl = buildClientMiniAppLink(qrLink.slug);

        const qrCodeModule = await loadQrCodeModule();
        const qrCodeDataUrl = await qrCodeModule.toDataURL(catalogUrl, {
          width: 300,
        });

        if (isMounted) {
          setLinkData({
            url: catalogUrl,
            qrCodeDataUrl,
            catalogTitle: catalog.title,
            qrLink,
          });
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error handling QR code:', err);
          setCatalogError('Ошибка при создании QR-кода');
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    };

    handleQRGeneration();

    return () => {
      isMounted = false;
    };
  }, [catalogId, catalog, qrLinks, qrLoading, catalogError, qrError, linkData, generateQRForCatalog]);

  const handleCopyLink = async () => {
    if (linkData?.url) {
      try {
        await navigator.clipboard.writeText(linkData.url);
        // setCopySuccess(true);
        toast.success('Ссылка скопирована');
        // setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        toast.error('Не удалось скопировать ссылку');
      }
    }
  };

  const handleDownloadQR = async () => {
    if (!linkData?.qrCodeDataUrl) return;
    try {
      const response = await fetch(linkData.qrCodeDataUrl);
      const blob = await response.blob();
      await saveBlobToDevice(
        blob,
        `qr-code-${catalogId}.png`,
        'QR-код сохранен'
      );
    } catch {
      toast.error('Не удалось скачать QR-код');
    }
  };

  const handleShare = async () => {
    if (linkData?.url) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Каталог: ${linkData.catalogTitle}`,
            url: linkData.url,
          });
          toast.success('Ссылка отправлена');
        } catch {
          toast.error('Не удалось поделиться ссылкой');
        }
      } else {
        // Fallback to copy if Web Share API is not supported
        handleCopyLink();
      }
    }
  };

  const handleDownloadTableQrs = async () => {
    if (!linkData?.qrLink?.slug) return;
    const qrCodeModule = await loadQrCodeModule();
    const { jsPDF } = await loadJsPdfModule();
    const count = Math.min(100, Math.max(1, Number(tablesCount || 1)));
    const rows: Array<{ table: number; qr: string; url: string }> = [];

    for (let i = 1; i <= count; i += 1) {
      const url = buildClientMiniAppLink(linkData.qrLink.slug, i);
      const qr = await qrCodeModule.toDataURL(url, { width: 240 });
      rows.push({ table: i, qr, url });
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (index > 0) {
        doc.addPage('a4', 'portrait');
      }

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = 1240;
      pageCanvas.height = 1754;
      const ctx = pageCanvas.getContext('2d');
      if (!ctx) {
        toast.error('Не удалось подготовить PDF');
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.font = 'bold 72px Arial, sans-serif';
      ctx.fillText(`Столик: ${row.table}`, pageCanvas.width / 2, 140);

      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error('QR image load failed'));
        qrImg.src = row.qr;
      });

      const qrSize = 760;
      const qrX = (pageCanvas.width - qrSize) / 2;
      const qrY = 220;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = '#4b5563';
      ctx.font = '30px Arial, sans-serif';
      ctx.fillText(row.url, pageCanvas.width / 2, qrY + qrSize + 80);

      const pageDataUrl = pageCanvas.toDataURL('image/png');
      doc.addImage(pageDataUrl, 'PNG', 0, 0, 210, 297);
    }

    const blob = doc.output('blob');
    await saveBlobToDevice(
      blob,
      `table-qrs-${catalogId}.pdf`,
      'PDF с QR-кодами столиков сохранен'
    );
  };

  if (isGenerating || qrLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center gap-2 text-lg">
            <Spinner />
            <span>Генерация ссылки и QR-кода...</span>
          </div>
        </div>
      </div>
    );
  }

  if (catalogError || qrError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-6 rounded-xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Ошибка</h2>
          <p className="text-muted-foreground mb-4">
            {catalogError || qrError}
          </p>
          <Button onClick={() => navigate(-1)}>Назад</Button>
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center gap-2 text-lg">
            <Spinner />
            <span>Загрузка каталога...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Ссылка и QR-код</h1>
            <p className="text-sm text-muted-foreground">{catalog.title}</p>
          </div>
          <BusinessTutorialLauncher currentSection="links" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {linkData && (
          <>
            <Card data-tour="links-qr-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR-код
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <img
                  src={linkData.qrCodeDataUrl}
                  alt="QR код каталога"
                  className="rounded-xl border-2 border-border p-2"
                />
                <div className="text-center">
                  <h3 className="font-medium">{linkData.catalogTitle}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Отсканируйте QR-код для открытия каталога
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <Button onClick={handleDownloadQR} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Скачать QR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Поделиться
                  </Button>
                </div>
              </CardContent>
            </Card>

            {catalog.type === 'goods' &&
              catalog.subtype === 'cafe_restaurant' && (
                <Card data-tour="links-table-qr">
                  <CardHeader>
                    <CardTitle>QR-коды для столиков</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="tables-count">Количество столиков</Label>
                      <Input
                        id="tables-count"
                        type="number"
                        min={1}
                        max={100}
                        value={tablesCount}
                        onChange={e =>
                          setTablesCount(
                            String(
                              Math.min(
                                100,
                                Math.max(1, Number(e.target.value || 1))
                              )
                            )
                          )
                        }
                      />
                    </div>
                    <Button className="w-full" onClick={handleDownloadTableQrs}>
                      Сформировать QR для столиков
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Будет сформирован PDF-файл для печати с отдельным QR для
                      каждого столика.
                    </p>
                  </CardContent>
                </Card>
              )}

            <Card data-tour="links-direct-link">
              <CardHeader>
                <CardTitle>Прямая ссылка</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label
                    htmlFor="catalog-link"
                    className="block mb-2 text-sm font-medium"
                  >
                    Ссылка на каталог
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="catalog-link"
                      value={linkData.url}
                      readOnly
                      className="flex-1 glass-input"
                    />
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border-primary/20">
                  <h4 className="font-medium text-foreground mb-2">
                    Как использовать:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Скопируйте ссылку и отправьте клиентам</li>
                    <li>Распечатайте QR-код и разместите в заведении</li>
                    <li>
                      Используйте кнопку "Поделиться" для быстрого
                      распространения
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <TourOverlay
        open={tutorial.open}
        steps={
          catalog?.type === 'goods' && catalog?.subtype === 'cafe_restaurant'
            ? linksTutorialSteps
            : linksTutorialSteps.filter(step => step.id !== 'tables')
        }
        sectionTitle="Ссылки и QR"
        onClose={tutorial.closeAndMarkSeen}
        onComplete={tutorial.complete}
      />
    </div>
  );
}
