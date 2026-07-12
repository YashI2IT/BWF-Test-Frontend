'use client';

import { Bell, Menu } from 'lucide-react';
import { Button } from '@/app/warden/Template/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/warden/Template/components/ui/dropdown-menu';
import { Badge } from '@/app/warden/Template/components/ui/badge';

type TopNavProps = {
  onMenuClick?: () => void;
};

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border/50 backdrop-blur-sm animate-slide-in-bottom">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden h-9 w-9 rounded-lg hover:bg-muted/60"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </Button>
          <h2 className="text-base md:text-lg font-semibold text-foreground truncate">Warden Dashboard</h2>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-muted/50 transition-colors duration-200"
              >
                <Bell className="w-5 h-5 text-foreground" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-destructive text-white shadow-md animate-pulse-glow">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 animate-scale-in">
              <div className="px-4 py-3 font-semibold text-sm text-foreground border-b border-border">Notifications</div>
              <DropdownMenuItem className="flex flex-col items-start gap-1.5 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <p className="text-sm font-medium text-foreground">New Complaint Filed</p>
                <p className="text-xs text-muted-foreground">Room 204: Noise complaint</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1.5 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <p className="text-sm font-medium text-foreground">Activity Approval Request</p>
                <p className="text-xs text-muted-foreground">Birthday celebration event</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1.5 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <p className="text-sm font-medium text-foreground">Expense Request Pending</p>
                <p className="text-xs text-muted-foreground">Medical supplies - Rs. 2,500</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs text-center text-primary cursor-pointer py-2 hover:bg-muted/50">
                View All Notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
