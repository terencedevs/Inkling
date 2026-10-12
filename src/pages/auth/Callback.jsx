import { useEffect } from 'react';
import { sdk } from '@/services/sdk';
import { Loader2 } from 'lucide-react';

export default function Callback() {
  useEffect(() => {
    sdk.session.ui?.showSSOVerify?.('#callback-target');
    return () => sdk.session.ui?.showBlank?.('#callback-target');
  }, []);

  return (
    <div className="min-h-svh flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verifying your account…</p>
      </div>
      <div id="callback-target" />
    </div>
  );
}
