import { BellIcon } from 'lucide-react';
import CommandPalette from './CommandPalette';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const AppHeader = () => {
  return (
    <header className="h-14 border-b px-4 flex items-center justify-between select-none shrink-0 z-20">
      <div className="flex items-center justify-center gap-2">
        <div className="w-7 h-7 rounded-md bg-primary font-bold flex items-center justify-center text-secondary">
          R
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-md text-primary tracking-widest">RELAY</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4">
        <CommandPalette />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="size-7">
          <BellIcon aria-hidden="true" />
          <Badge
            className="absolute -inset-e-2 top-0 z-10 text-xs"
            size="sm"
            pill
            variant="destructive"
          >
            99+
          </Badge>
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
