
import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGradientProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  colors?: 'blue' | 'purple' | 'mixed';
}

export function AnimatedGradient({
  children,
  className,
  intensity = 'medium',
  colors = 'blue',
}: AnimatedGradientProps) {
  const getGradientClasses = () => {
    const intensityMap = {
      subtle: 'from-blue-50 via-white to-blue-50',
      medium: 'from-blue-100 via-white to-blue-100',
      strong: 'from-blue-200 via-white to-blue-200',
    };

    if (colors === 'purple') {
      return {
        subtle: 'from-purple-50 via-white to-purple-50',
        medium: 'from-purple-100 via-white to-purple-100',
        strong: 'from-purple-200 via-white to-purple-200',
      }[intensity];
    }

    if (colors === 'mixed') {
      return {
        subtle: 'from-blue-50 via-white to-purple-50',
        medium: 'from-blue-100 via-white to-purple-100',
        strong: 'from-blue-200 via-white to-purple-200',
      }[intensity];
    }

    return intensityMap[intensity];
  };

  return (
    <div className={cn(
      'bg-gradient-to-br bg-[length:400%_400%] animate-gradient-shift',
      getGradientClasses(),
      className
    )}>
      {children}
    </div>
  );
}
