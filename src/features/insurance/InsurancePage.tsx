// Insurance Page
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus } from 'lucide-react';

export function InsurancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Insurance Information</h1>
          <p className="text-muted-foreground mt-1">Manage your insurance details</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Insurance
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Insurance Plans</CardTitle>
          <CardDescription>View and update your insurance information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No insurance information on file</p>
            <p className="text-sm mt-2">Add your insurance details to get started</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
