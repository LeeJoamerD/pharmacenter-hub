
import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGradientProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  colors?: 'blue' | 'purple' | 'mixed' | 'green' | 'amber' | 'primary';
  speed?: 'slow' | 'medium' | 'fast';
  pattern?: 'linear' | 'radial' | 'conic';
}

export function AnimatedGradient({
  children,
  className,
  intensity = 'medium',
  colors = 'blue',
  speed = 'medium',
  pattern = 'linear',
}: AnimatedGradientProps) {
  const getGradientClasses = () => {
    // Intensités de base pour les couleurs bleues
    const intensityMap = {
      subtle: 'from-blue-50 via-white to-blue-50',
      medium: 'from-blue-100 via-white to-blue-100',
      strong: 'from-blue-200 via-white to-blue-200',
    };

    // Couleurs violettes
    if (colors === 'purple') {
      return {
        subtle: 'from-purple-50 via-white to-purple-50',
        medium: 'from-purple-100 via-white to-purple-100',
        strong: 'from-purple-200 via-white to-purple-200',
      }[intensity];
    }

    // Couleurs mixtes (bleu et violet)
    if (colors === 'mixed') {
      return {
        subtle: 'from-blue-50 via-white to-purple-50',
        medium: 'from-blue-100 via-white to-purple-100',
        strong: 'from-blue-200 via-white to-purple-200',
      }[intensity];
    }

    // Couleurs vertes
    if (colors === 'green') {
      return {
        subtle: 'from-green-50 via-white to-green-50',
        medium: 'from-green-100 via-white to-green-100',
        strong: 'from-green-200 via-white to-green-200',
      }[intensity];
    }

    // Couleurs ambre/dorées
    if (colors === 'amber') {
      return {
        subtle: 'from-amber-50 via-white to-amber-50',
        medium: 'from-amber-100 via-white to-amber-100',
        strong: 'from-amber-200 via-white to-amber-200',
      }[intensity];
    }

    // Couleurs primary (utilise la couleur primary définie dans le thème)
    if (colors === 'primary') {
      return {
        subtle: 'from-primary/10 via-white to-primary/10',
        medium: 'from-primary/20 via-white to-primary/20',
        strong: 'from-primary/30 via-white to-primary/30',
      }[intensity];
    }

    return intensityMap[intensity];
  };

  const getSpeedClass = () => {
    return {
      slow: 'animate-gradient-shift-slow',
      medium: 'animate-gradient-shift',
      fast: 'animate-gradient-shift-fast',
    }[speed];
  };

  const getPatternClass = () => {
    return {
      linear: 'bg-gradient-to-br',
      radial: 'bg-radial',
      conic: 'bg-conic',
    }[pattern];
  };

  return (
    <div className={cn(
      getPatternClass(),
      'bg-[length:400%_400%]',
      getSpeedClass(),
      getGradientClasses(),
      className
    )}>
      {children}
    </div>
  );
}
