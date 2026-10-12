import { useSelector } from 'react-redux';

export default function ProfileGuard({ profiles = [], children, fallback = null }) {
  const user = useSelector((state) => state.user.user);
  if (!user) return fallback;
  if (!profiles.includes(user.profile)) return fallback;
  return children;
}
