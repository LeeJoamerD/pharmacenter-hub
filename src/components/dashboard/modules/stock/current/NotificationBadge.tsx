import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
}

export const NotificationBadge = ({ count, onClick }: NotificationBadgeProps) => {
  if (count === 0) return null;

  return (
    <div 
      className="relative cursor-pointer" 
      onClick={onClick}
    >
      <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      <Badge 
        variant="destructive" 
        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
      >
        {count > 99 ? '99+' : count}
      </Badge>
    </div>
  );
};
