/* Small reusable hook: fades sections in as you scroll down the homepage (IntersectionObserver). Used by: pages/HomePage.jsx. */
import { useEffect } from 'react';

export function useScrollReveal() {
  // Observe each reveal element until it first enters the viewport.
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Use its position among sibling reveal elements for a staggered entrance.
          const siblings = entry.target.parentElement.querySelectorAll('.reveal');
          siblings.forEach((sib, idx) => {
            if (sib === entry.target) {
              setTimeout(() => entry.target.classList.add('visible'), idx * 80);
            }
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
