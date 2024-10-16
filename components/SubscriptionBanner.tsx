import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SubscriptionBanner = () => {
  return (
    <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 flex justify-between items-center">
      <div>
        Subscribe in <span className="font-bold">3</span> days to get your first month for $1
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
          Subscribe now
        </Button>
        <X className="cursor-pointer" size={24} />
      </div>
    </div>
  );
};

export default SubscriptionBanner;
