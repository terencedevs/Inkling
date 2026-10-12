import ProviderAuthPage from './ProviderAuthPage';
import { sdk } from '@/services/sdk';

export default function PromptPassword() {
  return (
    <ProviderAuthPage
      title="Set a Password"
      description="Create a password to use alongside your social login"
      targetId="prompt-target"
      mount={(t) => sdk.session.ui?.showPromptPassword?.(t)}
    />
  );
}
