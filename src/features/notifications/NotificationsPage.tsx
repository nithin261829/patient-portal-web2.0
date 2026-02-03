// Notifications Page
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-1">Stay updated with your healthcare communications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>View all your notifications and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm mt-2">You're all caught up!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
