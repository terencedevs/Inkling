import { useSelector } from 'react-redux';

export function useProfile() {
  const user = useSelector((state) => state.user.user);
  const profile = user?.profile ?? '';
  return {
    profile,
    hasProfile: (name) => profile === name,
    isAuthenticated: Boolean(user),
  };
}
