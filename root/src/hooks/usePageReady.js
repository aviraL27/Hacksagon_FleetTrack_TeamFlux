import { useEffect, useState } from 'react';

export default function usePageReady(delay = 280) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIsReady(true);
    }, delay);

    return () => window.clearTimeout(timerId);
  }, [delay]);

  return isReady;
}
