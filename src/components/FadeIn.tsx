
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  className?: string;
  once?: boolean;
  distance?: number;
}

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.7,
  className,
  once = true,
  distance = 20,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [once]);

  const getDirectionStyles = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return { opacity: 0, transform: `translateY(${distance}px)` };
        case 'down':
          return { opacity: 0, transform: `translateY(-${distance}px)` };
        case 'left':
          return { opacity: 0, transform: `translateX(${distance}px)` };
        case 'right':
          return { opacity: 0, transform: `translateX(-${distance}px)` };
        default:
          return { opacity: 0 };
      }
    }
    return { opacity: 1, transform: 'translate(0, 0)' };
  };

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        ...getDirectionStyles(),
        transition: `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
