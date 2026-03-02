import { Button } from '@/components/ui/button';
import { useSectionPermissions, SectionName, PermissionType } from '@/hooks/useSectionPermissions';
import { useToast } from '@/hooks/use-toast';
import { LucideIcon } from 'lucide-react';

interface PermissionButtonProps {
  section: SectionName;
  permission: PermissionType;
  onClick: () => void;
  icon?: LucideIcon;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  title?: string;
}

export function PermissionButton({
  section,
  permission,
  onClick,
  icon: Icon,
  children,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  title,
}: PermissionButtonProps) {
  const { hasPermission } = useSectionPermissions();
  const { toast } = useToast();

  const allowed = hasPermission(section, permission);

  const handleClick = () => {
    if (!allowed) {
      toast({
        title: 'Permission Denied',
        description: `You don't have permission to ${permission} in this section`,
        variant: 'destructive',
      });
      return;
    }
    onClick();
  };

  // Hide button if no permission
  if (!allowed) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={className}
      title={title}
    >
      {Icon && <Icon className="h-4 w-4 mr-2" />}
      {children}
    </Button>
  );
}
