import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
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
