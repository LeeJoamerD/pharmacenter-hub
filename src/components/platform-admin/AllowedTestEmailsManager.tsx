import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AllowedTestEmail {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

const AllowedTestEmailsManager = () => {
  const [emails, setEmails] = useState<AllowedTestEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchEmails = async () => {
    const { data, error } = await (supabase as any)
      .from('allowed_test_emails')
      .select('id, email, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erreur lors du chargement des emails');
      console.error(error);
    } else {
      setEmails(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEmails(); }, []);

  const handleAdd = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Veuillez entrer un email valide');
      return;
    }
    setAdding(true);
    const { error } = await (supabase as any)
      .from('allowed_test_emails')
      .insert({ email: trimmed });

    if (error) {
      toast.error(error.code === '23505' ? 'Cet email existe déjà' : 'Erreur lors de l\'ajout');
    } else {
      toast.success('Email ajouté');
      setNewEmail('');
      fetchEmails();
    }
    setAdding(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await (supabase as any)
      .from('allowed_test_emails')
      .update({ is_active: !current })
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      setEmails(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any)
      .from('allowed_test_emails')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Email supprimé');
      setEmails(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Emails autorisés aux tests</h2>
        <p className="text-muted-foreground">Gérez les adresses email autorisées à accéder à la pharmacie de test.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Ajouter un email
          </CardTitle>
          <CardDescription>L'utilisateur pourra cliquer sur "Tester PharmaSoft" et accéder au tenant de test.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="email@exemple.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="max-w-sm"
            />
            <Button onClick={handleAdd} disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des emails ({emails.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : emails.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun email autorisé pour le moment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggle(item.id, item.is_active)}
                        />
                        <span className={item.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                          {item.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr })}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cet email ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              L'adresse {item.email} ne pourra plus accéder aux tests.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllowedTestEmailsManager;
