import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Edit, Trash2, Shield, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const UserSettings = () => {
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: 'admin',
      email: 'admin@pharmasoft.ci',
      role: 'Administrateur',
      status: 'active',
      lastLogin: '2024-12-20 10:30'
    },
    {
      id: 2,
      username: 'pharmacien1',
      email: 'pharmacien@pharmasoft.ci',
      role: 'Pharmacien',
      status: 'active',
      lastLogin: '2024-12-20 09:15'
    },
    {
      id: 3,
      username: 'vendeur1',
      email: 'vendeur@pharmasoft.ci',
      role: 'Vendeur',
      status: 'inactive',
      lastLogin: '2024-12-19 16:45'
    }
  ]);

  const [userSettings, setUserSettings] = useState({
    maxUsers: 10,
    sessionTimeout: 30,
    passwordPolicy: 'medium',
    twoFactorAuth: false,
    autoLogout: true,
    loginAttempts: 3
  });

  const handleSaveSettings = () => {
    toast({
      title: "Paramètres utilisateurs sauvegardés",
      description: "La configuration des utilisateurs a été mise à jour.",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrateur': return 'bg-red-100 text-red-800';
      case 'Pharmacien': return 'bg-blue-100 text-blue-800';
      case 'Vendeur': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Politique de Sécurité
            </CardTitle>
            <CardDescription>
              Configuration de la sécurité des comptes utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxUsers">Nombre max d'utilisateurs</Label>
              <Input
                id="maxUsers"
                type="number"
                value={userSettings.maxUsers}
                onChange={(e) => setUserSettings(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout session (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={userSettings.sessionTimeout}
                onChange={(e) => setUserSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passwordPolicy">Politique mot de passe</Label>
              <Select 
                value={userSettings.passwordPolicy} 
                onValueChange={(value) => setUserSettings(prev => ({ ...prev, passwordPolicy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible (6 caractères min)</SelectItem>
                  <SelectItem value="medium">Moyenne (8 caractères + chiffres)</SelectItem>
                  <SelectItem value="high">Forte (12 caractères + symboles)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loginAttempts">Tentatives de connexion max</Label>
              <Input
                id="loginAttempts"
                type="number"
                value={userSettings.loginAttempts}
                onChange={(e) => setUserSettings(prev => ({ ...prev, loginAttempts: Number(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Options de Sécurité
            </CardTitle>
            <CardDescription>
              Configuration avancée de la sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="twoFactor">Authentification à 2 facteurs</Label>
              <Switch
                id="twoFactor"
                checked={userSettings.twoFactorAuth}
                onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoLogout">Déconnexion automatique</Label>
              <Switch
                id="autoLogout"
                checked={userSettings.autoLogout}
                onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, autoLogout: checked }))}
              />
            </div>
            
            <div className="pt-4">
              <Button onClick={handleSaveSettings} className="w-full">
                Sauvegarder la configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestion des Utilisateurs
              </CardTitle>
              <CardDescription>
                Liste et gestion des comptes utilisateurs
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom d'utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSettings;