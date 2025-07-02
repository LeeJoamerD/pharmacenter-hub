import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Save, X } from 'lucide-react';
import type { Client } from '../ClientModule';

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (client: Client) => void;
  onCancel: () => void;
}

const ClientForm = ({ client, onSubmit, onCancel }: ClientFormProps) => {
  const { toast } = useToast();

  const form = useForm<Client>({
    defaultValues: client || {
      noms: '',
      prenoms: '',
      adresse: '',
      telephone_appel: '',
      telephone_whatsapp: '',
      email: '',
      niu_cni: '',
      profession: '',
      date_naissance: '',
      situation_familiale: 'celibataire',
      nombre_enfants: 0,
      type_client: 'particulier',
      statut: 'actif',
      date_creation: new Date().toISOString().split('T')[0],
      notes: ''
    }
  });

  const handleSubmit = (data: Client) => {
    onSubmit(data);
    toast({
      title: client ? "Client modifié" : "Client ajouté",
      description: client ? "Le client a été modifié avec succès." : "Le nouveau client a été ajouté avec succès.",
    });
    if (!client) {
      form.reset();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {client ? 'Modifier le client' : 'Ajouter un nouveau client'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="noms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de famille *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="KOUAME" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prenoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénoms *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Jean Baptiste" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="jean.kouame@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telephone_appel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone principal *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+225 0123456789" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telephone_whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone WhatsApp</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+225 0123456789" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="niu_cni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIU/CNI *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="CI0123456789" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profession</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ingénieur" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_naissance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="situation_familiale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situation familiale</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="celibataire">Célibataire</SelectItem>
                        <SelectItem value="marie">Marié(e)</SelectItem>
                        <SelectItem value="divorce">Divorcé(e)</SelectItem>
                        <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nombre_enfants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre d'enfants</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="0"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type_client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de client *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="particulier">Particulier</SelectItem>
                        <SelectItem value="professionnel">Professionnel</SelectItem>
                        <SelectItem value="entreprise">Entreprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="inactif">Inactif</SelectItem>
                        <SelectItem value="suspendu">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse complète *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Abidjan, Cocody Riviera..."
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Notes additionnelles sur le client..."
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {client ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ClientForm;