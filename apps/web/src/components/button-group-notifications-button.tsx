import { BellIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';

const ButtonGroupNotificationsButton = () => (
  <ButtonGroup aria-label="Notifications">
    <Button
      aria-label="Notifications, 12 unread"
      className="relative"
      size="icon-sm"
      variant="outline"
    >
      <BellIcon aria-hidden="true" />
      <Badge className="absolute -end-2 -top-1 z-10 text-xs" pill size="sm">
        12
      </Badge>
    </Button>
    <Button
      aria-label="Alerts, more than 99 unread"
      className="relative"
      size="icon-sm"
      variant="outline"
    >
      <BellIcon aria-hidden="true" />
      <Badge className="absolute -end-2 -top-1 z-10 text-xs" pill size="sm" variant="destructive">
        99+
      </Badge>
    </Button>
  </ButtonGroup>
);

export default ButtonGroupNotificationsButton;
