
import { useState, useEffect } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { currentLanguage, changeLanguage, languages } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "flex items-center gap-1 px-2 h-8 text-sm font-medium transition-all",
            className
          )}
        >
          <Globe size={16} className="opacity-70" />
          <span className="ml-1">{currentLanguage.code.toUpperCase()}</span>
          <ChevronDown size={14} className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-white/90 backdrop-blur-lg border border-border/20">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              currentLanguage.code === language.code && "bg-primary/10"
            )}
            onClick={() => changeLanguage(language)}
          >
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </div>
            {currentLanguage.code === language.code && (
              <Check size={16} className="text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
