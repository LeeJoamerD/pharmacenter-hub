import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Mail, Search, Eye, CheckCircle, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Email {
  id: string;
  subject: string;
  from_email: string;
  to_email: string;
  content?: string;
  summary?: string;
  suggested_response?: string;
  classification: string;
  priority: string;
  processed: boolean;
  received_at: string;
  created_at: string;
}

const EmailManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emailDialog, setEmailDialog] = useState(false);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('received_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error loading emails:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les emails",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.classification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClassificationBadge = (classification: string) => {
    const classificationConfig = {
      'urgent': { variant: 'destructive' as const, label: 'Urgent', icon: AlertCircle },
      'commercial': { variant: 'default' as const, label: 'Commercial', icon: Mail },
      'administratif': { variant: 'secondary' as const, label: 'Administratif', icon: Mail },
      'medical': { variant: 'default' as const, label: 'Médical', icon: Mail },
      'technique': { variant: 'outline' as const, label: 'Technique', icon: Mail }
    };
    
    const config = classificationConfig[classification as keyof typeof classificationConfig] || {
      variant: 'secondary' as const,
      label: classification,
      icon: Mail
    };
    
    const IconComponent = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': { variant: 'secondary' as const, label: 'Faible' },
      'normal': { variant: 'outline' as const, label: 'Normale' },
      'high': { variant: 'destructive' as const, label: 'Haute' },
      'urgent': { variant: 'destructive' as const, label: 'Urgente' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setEmailDialog(true);
  };

  const markAsProcessed = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('emails')
        .update({ processed: true })
        .eq('id', emailId);

      if (error) throw error;

      setEmails(emails.map(email => 
        email.id === emailId ? { ...email, processed: true } : email
      ));

      toast({
        title: "Succès",
        description: "Email marqué comme traité",
      });
    } catch (error) {
      console.error('Error marking email as processed:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer l'email comme traité",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Emails</h2>
          <p className="text-muted-foreground">
            Emails intelligemment classifiés et analysés par IA
          </p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Non traités</p>
                <p className="text-2xl font-bold">{emails.filter(e => !e.processed).length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{emails.length}</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emails Table */}
      <Card>
        <CardHeader>
          <CardTitle>Emails Reçus</CardTitle>
          <CardDescription>
            {filteredEmails.length} email{filteredEmails.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sujet</TableHead>
                <TableHead>Expéditeur</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {email.subject}
                  </TableCell>
                  <TableCell>{email.from_email}</TableCell>
                  <TableCell>
                    {getClassificationBadge(email.classification)}
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(email.priority)}
                  </TableCell>
                  <TableCell>
                    {email.received_at ? 
                      new Date(email.received_at).toLocaleDateString('fr-FR') :
                      new Date(email.created_at).toLocaleDateString('fr-FR')
                    }
                  </TableCell>
                  <TableCell>
                    {email.processed ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Traité
                      </Badge>
                    ) : (
                      <Badge variant="secondary">En attente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEmailClick(email)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!email.processed && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markAsProcessed(email.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredEmails.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun email trouvé
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Detail Dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Détail de l'Email</DialogTitle>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>De</Label>
                  <p className="text-sm">{selectedEmail.from_email}</p>
                </div>
                <div>
                  <Label>À</Label>
                  <p className="text-sm">{selectedEmail.to_email}</p>
                </div>
                <div>
                  <Label>Classification</Label>
                  <div>{getClassificationBadge(selectedEmail.classification)}</div>
                </div>
                <div>
                  <Label>Priorité</Label>
                  <div>{getPriorityBadge(selectedEmail.priority)}</div>
                </div>
              </div>
              
              <div>
                <Label>Sujet</Label>
                <p className="text-sm font-medium">{selectedEmail.subject}</p>
              </div>

              {selectedEmail.summary && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Résumé IA
                  </Label>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm">{selectedEmail.summary}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedEmail.suggested_response && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Réponse Suggérée
                  </Label>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedEmail.suggested_response}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedEmail.content && (
                <div>
                  <Label>Contenu</Label>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {selectedEmail.content}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailManager;