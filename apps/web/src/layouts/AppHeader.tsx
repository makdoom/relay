import CommandPalette from '../components/CommandPalette';
import UserProfile from '../components/UserProfile';

const AppHeader = () => {
  return (
    <header className="h-14 border-b px-4 flex items-center justify-between select-none shrink-0 z-20">
      <div className="flex items-center justify-center gap-2">
        <div className="size-8 rounded-md bg-primary font-bold flex items-center justify-center text-secondary">
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
        <UserProfile />
      </div>
    </header>
  );
};

export default AppHeader;
