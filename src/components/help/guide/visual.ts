import type { GuideCallout, GuideModule } from './types';

export function moduleAccentClasses(accent: GuideModule['accent'] = 'primary') {
  const variants = {
    primary: 'from-primary to-info',
    secondary: 'from-secondary to-muted',
    accent: 'from-accent to-secondary',
    success: 'from-success to-primary',
    warning: 'from-warning to-primary',
    info: 'from-info to-primary',
  } as const;
  return variants[accent];
}

export function calloutClasses(type: GuideCallout['type']) {
  const variants = {
    tip: 'border-warning/30 bg-warning/10 text-foreground',
    warning: 'border-destructive/30 bg-destructive/10 text-foreground',
    info: 'border-info/30 bg-info/10 text-foreground',
    success: 'border-success/30 bg-success/10 text-foreground',
  } as const;
  return variants[type];
}
