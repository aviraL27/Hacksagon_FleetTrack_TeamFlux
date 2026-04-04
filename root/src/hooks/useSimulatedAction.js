import { useEffect, useRef, useState } from 'react';

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

export default function useSimulatedAction(defaultDelay = 350) {
  const [pendingKey, setPendingKey] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function runAction(key, callback, delay = defaultDelay) {
    setPendingKey(key);

    try {
      await wait(delay);
      return await callback?.();
    } finally {
      if (isMountedRef.current) {
        setPendingKey(null);
      }
    }
  }

  return {
    pendingKey,
    runAction,
  };
}
