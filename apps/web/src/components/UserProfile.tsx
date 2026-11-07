import { CreditCardIcon, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const UserProfile = () => {
  const { logout } = useAuth();
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="size-8">
            <AvatarImage
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&dpr=2&q=80"
              alt="Mak"
            />
            <AvatarFallback>MS</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={12} className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-foreground text-sm">"Makdoom Shaikh</span>
                <span className="text-muted-foreground text-xs">makshaikh99@gmail.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon className="size-4 opacity-60" aria-hidden="true" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon className="size-4 opacity-60" aria-hidden="true" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className="size-4 opacity-60" aria-hidden="true" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => logout()}>
              <LogOutIcon aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfile;
