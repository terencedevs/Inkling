import { useState } from 'react';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ProviderAuthPage from './ProviderAuthPage';
import AuthLayout from './AuthLayout';

export const route = {
  path: '/change-password',
  layout: 'owner',
  access: 'authenticated',
};

export default function ChangePassword() {
  const hasUI = Boolean(sdk.session.ui);

  if (hasUI) {
    return (
      <ProviderAuthPage
        targetId="change-password-target"
        mount={(t) => sdk.session.ui.showChangePassword(t)}
      />
    );
  }

  return <HeadlessChangePassword />;
}

function HeadlessChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const result = await sdk.session.changePassword({ currentPassword, newPassword, confirmPassword });
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error?.message || 'Failed to change password');
      }
    } catch (err) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-[28rem] mx-auto p-6">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="size-16 rounded-full bg-gradient-to-br from-success to-success/60 flex items-center justify-center">
            <ApperIcon name="CheckCircle" size={28} className="text-success-foreground" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Password changed</h1>
        </div>
        <div className="rounded-xl border bg-muted/30 p-5 text-center">
          <p className="text-sm text-foreground">Your password has been changed successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[28rem] mx-auto p-6">
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="size-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <ApperIcon name="Lock" size={28} className="text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold tracking-tight">Change password</h1>
          <p className="text-sm text-muted-foreground mt-1">Update your current password.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <PasswordField
          id="currentPassword"
          label="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          show={showCurrent}
          onToggle={() => setShowCurrent(!showCurrent)}
          autoFocus
        />
        <PasswordField
          id="newPassword"
          label="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="pt-2">
          <Button type="submit" disabled={loading} className="w-full h-9">
            {loading ? 'Updating…' : 'Change password'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, show, onToggle, autoFocus }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          autoFocus={autoFocus}
          className="h-9 pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          <ApperIcon name={show ? 'EyeOff' : 'Eye'} size={16} />
        </button>
      </div>
    </div>
  );
}
