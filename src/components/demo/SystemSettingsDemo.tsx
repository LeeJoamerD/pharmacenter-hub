import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { Loader2, Building, Globe, DollarSign } from 'lucide-react';

/**
 * Composant de démonstration pour tester l'utilisation des paramètres système
 * dans d'autres modules de l'application
 */
export const SystemSettingsDemo = () => {
  const { 
    loading, 
    getPharmacyInfo, 
    getTaxSettings, 
    getRegionalSettings,
    getCurrentCurrency,
    getCurrentTimezone,
    getCurrentLanguage 
  } = useGlobalSystemSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement des paramètres...</span>
      </div>
    );
  }

  const pharmacyInfo = getPharmacyInfo();
  const taxSettings = getTaxSettings();
  const regionalSettings = getRegionalSettings();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Informations Pharmacie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4" />
              Pharmacie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pharmacyInfo ? (
              <>
                <div>
                  <p className="text-sm font-medium">{pharmacyInfo.name}</p>
                  <p className="text-xs text-muted-foreground">Code: {pharmacyInfo.code}</p>
                </div>
                <div>
                  <p className="text-xs">{pharmacyInfo.address}</p>
                  <p className="text-xs">{pharmacyInfo.city}</p>
                </div>
                <div>
                  <p className="text-xs">{pharmacyInfo.email}</p>
                  <p className="text-xs">{pharmacyInfo.telephone_appel}</p>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Paramètres Régionaux */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4" />
              Paramètres Régionaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {regionalSettings ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Devise:</span>
                  <Badge variant="secondary" className="text-xs">
                    {regionalSettings.currency?.symbol} {regionalSettings.currency?.code}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Langue:</span>
                  <Badge variant="secondary" className="text-xs">
                    {regionalSettings.language?.flag} {regionalSettings.language?.name}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs">Fuseau:</span>
                  <p className="text-xs text-muted-foreground">{regionalSettings.timezone?.name}</p>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Paramètres Fiscaux */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              Fiscalité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {taxSettings ? (
              <>
                <div className="flex justify-between">
                  <span className="text-xs">TVA:</span>
                  <Badge variant="outline" className="text-xs">
                    {taxSettings.taux_tva}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Centime add.:</span>
                  <Badge variant="outline" className="text-xs">
                    {taxSettings.taux_centime_additionnel}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Année fiscale:</span>
                  <Badge variant="secondary" className="text-xs">
                    {taxSettings.fiscal_year}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test des fonctions individuelles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tests des fonctions utilitaires</CardTitle>
          <CardDescription className="text-xs">
            Vérification que les hooks fonctionnent correctement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-xs">
            <div>
              <strong>getCurrentCurrency():</strong> {getCurrentCurrency()?.name || 'Non défini'}
            </div>
            <div>
              <strong>getCurrentTimezone():</strong> {getCurrentTimezone()?.name || 'Non défini'}
            </div>
            <div>
              <strong>getCurrentLanguage():</strong> {getCurrentLanguage()?.name || 'Non défini'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};