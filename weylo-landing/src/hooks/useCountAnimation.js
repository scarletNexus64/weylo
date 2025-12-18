import { useState, useEffect, useRef } from 'react';

/**
 * Hook pour animer un compteur de 0 à une valeur cible
 * @param {number} end - La valeur finale du compteur
 * @param {number} duration - Durée de l'animation en ms (défaut: 2000)
 * @param {boolean} start - Démarre l'animation quand true
 * @returns {number} La valeur actuelle du compteur
 */
export const useCountAnimation = (end, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!start || isAnimating) return;

    setIsAnimating(true);
    startTimeRef.current = null;

    const animate = (currentTime) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Fonction d'easing pour un effet plus naturel (ease-out)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);

      setCount(currentCount);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setIsAnimating(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [end, duration, start]);

  return count;
};

/**
 * Hook pour détecter quand un élément devient visible dans le viewport
 * @param {Object} options - Options pour l'Intersection Observer
 * @returns {Array} [ref, isVisible] - Ref à attacher à l'élément et état de visibilité
 */
export const useInView = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenVisible) {
          setIsVisible(true);
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.3,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [hasBeenVisible, options]);

  return [elementRef, isVisible];
};
