'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function RefreshButton() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Button onClick={handleRefresh} className="mt-2">
      <RefreshCw className="mr-2 h-4 w-4" />
      Check Connection
    </Button>
  );
}
