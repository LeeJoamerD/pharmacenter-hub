import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PenLine, History } from 'lucide-react';
import FreeUnitsEntryForm from './free-units/FreeUnitsEntryForm';
import FreeUnitsHistory from './free-units/FreeUnitsHistory';

const FreeUnitsTab: React.FC = () => {
  const [view, setView] = useState<'entry' | 'history'>('entry');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={view === 'entry' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('entry')}
        >
          <PenLine className="h-4 w-4 mr-2" />
          Saisie des UG
        </Button>
        <Button
          variant={view === 'history' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('history')}
        >
          <History className="h-4 w-4 mr-2" />
          Historique des UG
        </Button>
      </div>

      {view === 'entry' ? <FreeUnitsEntryForm /> : <FreeUnitsHistory />}
    </div>
  );
};

export default FreeUnitsTab;
