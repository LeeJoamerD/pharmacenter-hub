import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Palette, Save } from 'lucide-react';

interface CreateThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTheme: (theme: {
    theme_id: string;
    name: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    background_color: string;
    preview_class: string;
    is_network_shared: boolean;
  }) => void;
}

export const CreateThemeDialog: React.FC<CreateThemeDialogProps> = ({
  open,
  onOpenChange,
  onCreateTheme
}) => {
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState('#64748b');
  const [accentColor, setAccentColor] = useState('#8b5cf6');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isNetworkShared, setIsNetworkShared] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    const themeId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    onCreateTheme({
      theme_id: `custom-${themeId}-${Date.now()}`,
      name: name.trim(),
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      background_color: backgroundColor,
      preview_class: `bg-[${primaryColor}]`,
      is_network_shared: isNetworkShared
    });
    
    // Reset form
    setName('');
    setPrimaryColor('#0ea5e9');
    setSecondaryColor('#64748b');
    setAccentColor('#8b5cf6');
    setBackgroundColor('#ffffff');
    setIsNetworkShared(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Créer un Thème Personnalisé
          </DialogTitle>
          <DialogDescription>
            Définissez les couleurs de votre nouveau thème
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="theme-name">Nom du thème</Label>
            <Input
              id="theme-name"
              placeholder="Mon thème personnalisé"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Couleur primaire</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Couleur secondaire</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color">Couleur accent</Label>
              <div className="flex gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bg-color">Couleur fond</Label>
              <div className="flex gap-2">
                <Input
                  id="bg-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Aperçu</Label>
            <div 
              className="p-4 rounded-lg border"
              style={{ backgroundColor: backgroundColor }}
            >
              <div className="flex gap-2 mb-2">
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: secondaryColor }}
                />
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
              <div 
                className="text-sm font-medium"
                style={{ color: primaryColor }}
              >
                {name || 'Nouveau thème'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Partager avec le réseau</Label>
              <p className="text-sm text-muted-foreground">
                Rendre ce thème disponible pour les autres pharmacies
              </p>
            </div>
            <Switch
              checked={isNetworkShared}
              onCheckedChange={setIsNetworkShared}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Créer le thème
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateThemeDialog;
