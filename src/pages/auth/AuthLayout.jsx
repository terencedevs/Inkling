import ApperIcon from '@/components/ApperIcon';
import { APP_CONFIG } from '@/config/app.config';

export default function AuthLayout({ children, title, description, icon }) {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-[28rem]">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="size-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <ApperIcon name={icon ?? APP_CONFIG.icon} size={28} className="text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
