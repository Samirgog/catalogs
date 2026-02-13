import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookingStore } from '../stores/booking';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';

export function BookingPage() {
  const { selectedItem, clearSelectedItem } = useBookingStore();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleCancel = () => {
    clearSelectedItem();
    navigate(-1); // Go back to previous page
  };

  const handleBook = () => {
    // Here you would implement the actual booking logic
    console.log('Booking item:', selectedItem);
    // After booking, clear the selected item and navigate to confirmation
    clearSelectedItem();
    // For now, just navigate back
    navigate(-1);
  };

  if (!selectedItem) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">No service selected</h2>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-background">
      <div className="p-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2 flex-1">Booking</h1>
        </div>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-0 gap-2">
            {selectedItem.image_url && (
              <img 
                src={selectedItem.image_url} 
                alt={selectedItem.title}
                className="w-full h-48 object-cover rounded-xl"
              />
            )}
            <CardTitle className="mt-3 text-xl">{selectedItem.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between pt-3">
            {selectedItem.description && (
              <p className="text-muted-foreground mt-1">{selectedItem.description}</p>
            )}
            {selectedItem.price && (
              <p className="text-xl font-semibold mt-3">{selectedItem.price} ₽</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-x-0 border-b-0 p-4 pb-8">
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full h-12" 
            onClick={handleCancel}
          >
            Отмена
          </Button>
          <Button 
            className="w-full h-12" 
            onClick={handleBook}
          >
            <Calendar className="mr-2 h-5 w-5" />
            Забронировать
          </Button>
        </div>
      </div>
    </div>
  );
}
