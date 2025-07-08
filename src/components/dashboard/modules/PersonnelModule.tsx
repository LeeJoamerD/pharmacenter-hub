import UserManagement from '@/components/admin/UserManagement';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/types/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PersonnelModule = () => {
  const { canAccess } = usePermissions();

  if (!canAccess(PERMISSIONS.USERS_VIEW)) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Vous n'avez pas les permissions nécessaires pour accéder à ce module.
        </AlertDescription>
      </Alert>
    );
  }

  return <UserManagement />;
};

export default PersonnelModule;