/* Stops the page behind a popup from scrolling while the popup is open.
   Used by RoadmapModal, AdminRecordDialog and AuthModal. */
import { useEffect } from 'react';

export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const { body, documentElement } = document;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    // Keep the layout from shifting when the scrollbar disappears.
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [active]);
}
