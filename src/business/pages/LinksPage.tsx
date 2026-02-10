import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Copy, Download, Share2, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
// import { useQRLinks } from '../hooks/useQR';

type LinkData = {
  url: string;
  qrCodeDataUrl: string;
  catalogTitle: string;
};

export function LinksPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  
  // Use QR hook
//   const { qrLinks, loading: qrLoading, error: qrError, generateQRForCatalog } = useQRLinks(catalogId || '');
  
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate QR code when catalogId changes
  useEffect(() => {
    if (catalogId) {
      const catalogTitle = catalogId === 'new' ? 'Новый каталог' : `Catalog ${catalogId}`;
      const baseUrl = window.location.origin;
      const catalogUrl = `${baseUrl}/#/catalog/${catalogId}`;
      
      // Generate QR code
      QRCode.toDataURL(catalogUrl, { width: 300 })
        .then((qrCodeDataUrl: string) => {
          setLinkData({
            url: catalogUrl,
            qrCodeDataUrl,
            catalogTitle
          });
          setIsGenerating(false);
        })
        .catch((err: unknown) => {
          console.error('Error generating QR code:', err);
          setIsGenerating(false);
        });
    }
  }, [catalogId]);

  const handleCopyLink = async () => {
    if (linkData?.url) {
      try {
        await navigator.clipboard.writeText(linkData.url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleDownloadQR = () => {
    if (linkData?.qrCodeDataUrl) {
      const link = document.createElement('a');
      link.href = linkData.qrCodeDataUrl;
      link.download = `qr-code-${catalogId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (linkData?.url) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Каталог: ${linkData.catalogTitle}`,
            url: linkData.url
          });
        } catch (err) {
          console.log('Error sharing:', err);
        }
      } else {
        // Fallback to copy if Web Share API is not supported
        handleCopyLink();
      }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Генерация ссылки и QR-кода...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 border-b bg-background">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Ссылка и QR-код</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {linkData && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  QR-код каталога
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <img 
                  src={linkData.qrCodeDataUrl} 
                  alt="QR код каталога" 
                  className="border rounded-lg p-2"
                />
                <div className="text-center">
                  <h3 className="font-medium">{linkData.catalogTitle}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Отсканируйте QR-код для открытия каталога
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleDownloadQR}>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать QR
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Поделиться
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Прямая ссылка</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="catalog-link">Ссылка на каталог</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      id="catalog-link"
                      value={linkData.url}
                      readOnly
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleCopyLink}
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copySuccess ? 'Скопировано!' : 'Копировать'}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Как использовать:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Скопируйте ссылку и отправьте клиентам</li>
                    <li>• Распечатайте QR-код и разместите в заведении</li>
                    <li>• Используйте кнопку "Поделиться" для быстрого распространения</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}