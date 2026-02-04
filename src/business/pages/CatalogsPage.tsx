import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Catalog {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bannerUrl?: string;
}

const sampleCatalogs: Catalog[] = [
  {
    id: '1',
    title: 'Основное меню',
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-01',
    bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop',
  },
  {
    id: '2',
    title: 'Летние специальные предложения',
    isActive: false,
    createdAt: '2024-01-20',
    updatedAt: '2024-01-25',
    bannerUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop',
  },
  {
    id: '3',
    title: 'Напитки и закуски',
    isActive: true,
    createdAt: '2024-01-25',
    updatedAt: '2024-01-30',
    bannerUrl: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=400&h=200&fit=crop',
  },
];

export function CatalogsPage() {
  const [catalogs] = useState<Catalog[]>(sampleCatalogs);
  const navigate = useNavigate();
  
  const handleEditCatalog = (catalogId: string) => {
    // Navigate to the catalog editing page
    navigate(`/catalogs/${catalogId}/edit`);
  };
  
  const handleCreateCatalog = () => {
    // Navigate to the create catalog page
    navigate('/catalogs/new');
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Каталоги</h1>
            <p className="text-sm text-muted-foreground">Управление каталогами</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="text-xl font-bold">Б</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          {catalogs.map((catalog) => (
            <Card 
              key={catalog.id} 
              className="overflow-hidden transition-all hover:shadow-lg cursor-pointer group"
              onClick={() => handleEditCatalog(catalog.id)}
            >
              {/* Banner Image */}
              <div className="relative h-32 overflow-hidden">
                {catalog.bannerUrl ? (
                  <img 
                    src={catalog.bannerUrl} 
                    alt={catalog.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-medium text-4xl">{catalog.title.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
                <Badge 
                  variant={catalog.isActive ? 'default' : 'outline'} 
                  className={`absolute top-3 right-3 ${catalog.isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {catalog.isActive ? 'Активный' : 'Черновик'}
                </Badge>
              </div>
              
              {/* Card Content */}
              <div className="p-4">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {catalog.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Обновлено: {new Date(catalog.updatedAt).toLocaleDateString('ru-RU')}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCatalog(catalog.id);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="fixed bottom-6 left-4 right-4 px-4">
        <Button 
          className="w-full h-14 text-lg" 
          onClick={handleCreateCatalog}
        >
          <Plus className="w-5 h-5 mr-2" />
          Создать каталог
        </Button>
      </div>
    </div>
  );
}
