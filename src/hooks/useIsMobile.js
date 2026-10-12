import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function getMatch() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(getMatch);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setIsMobile(mql.matches);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
