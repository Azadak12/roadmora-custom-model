/* True once `active` has stayed true for `delayMs`. Used to tell users a
   load is taking longer than usual (e.g. a sleeping Render backend waking
   up) instead of leaving a bare spinner with no explanation. */
import { useEffect, useState } from 'react';

export function useSlowLoadHint(active, delayMs = 4000) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(active), active ? delayMs : 0);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return slow;
}
