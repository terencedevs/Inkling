import { sdk } from '@/services/sdk';
import ProviderAuthPage from './ProviderAuthPage';
import AuthLayout from './AuthLayout';

export default function AcceptInvitation() {
  const hasUI = !!sdk.session.ui;

  if (hasUI) {
    return (
      <ProviderAuthPage
        title="Accept Invitation"
        description="Set up your account to join the team"
        targetId="accept-invitation-target"
        mount={(t) => sdk.session.ui.showAcceptInvitation(t)}
      />
    );
  }

  return (
    <AuthLayout
      title="Accept Invitation"
      icon="UserPlus"
      description="Set up your account to join the team. The invitation token is read from the URL automatically."
    >
      <p className="text-sm text-muted-foreground text-center">
        Once processed, you will be redirected to the dashboard.
      </p>
    </AuthLayout>
  );
}
