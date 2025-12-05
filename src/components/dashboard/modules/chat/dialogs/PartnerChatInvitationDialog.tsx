import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { 
  Building, 
  Mail, 
  Phone, 
  MessageSquare, 
  Users,
  Search,
  Plus,
  Send
} from 'lucide-react';

interface AvailablePartner {
  id: string;
  type: 'fournisseur' | 'laboratoire';
  name: string;
  email?: string;
  phone?: string;
}

interface PartnerChatInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availablePartners: AvailablePartner[];
  channels: { id: string; name: string }[];
  onInvitePartner: (data: {
    partnerId: string;
    partnerType: 'fournisseur' | 'laboratoire';
    displayName: string;
    email?: string;
    phone?: string;
    chatEnabled: boolean;
    canInitiateConversation: boolean;
    allowedChannels: string[];
    invitationMessage?: string;
  }) => Promise<void>;
  loading?: boolean;
}

const PartnerChatInvitationDialog = ({
  open,
  onOpenChange,
  availablePartners,
  channels,
  onInvitePartner,
  loading = false
}: PartnerChatInvitationDialogProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<AvailablePartner | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [canInitiateConversation, setCanInitiateConversation] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [invitationMessage, setInvitationMessage] = useState('');

  const filteredPartners = availablePartners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPartner = (partner: AvailablePartner) => {
    setSelectedPartner(partner);
    setDisplayName(partner.name);
    setEmail(partner.email || '');
    setPhone(partner.phone || '');
  };

  const handleToggleChannel = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedPartner) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un partenaire.",
        variant: "destructive"
      });
      return;
    }

    if (selectedChannels.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un canal.",
        variant: "destructive"
      });
      return;
    }

    try {
      await onInvitePartner({
        partnerId: selectedPartner.id,
        partnerType: selectedPartner.type,
        displayName,
        email: email || undefined,
        phone: phone || undefined,
        chatEnabled,
        canInitiateConversation,
        allowedChannels: selectedChannels,
        invitationMessage: invitationMessage || undefined
      });

      toast({
        title: "Invitation envoyée",
        description: `${displayName} a été invité au chat réseau.`
      });

      // Reset form
      setSelectedPartner(null);
      setDisplayName('');
      setEmail('');
      setPhone('');
      setSelectedChannels([]);
      setInvitationMessage('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'invitation.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Inviter un Partenaire au Chat
          </DialogTitle>
          <DialogDescription>
            Invitez un fournisseur ou un laboratoire à rejoindre les canaux de discussion du réseau.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélection du partenaire */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Sélectionner un partenaire</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un partenaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-40 border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredPartners.length > 0 ? (
                  filteredPartners.map((partner) => (
                    <div
                      key={partner.id}
                      onClick={() => handleSelectPartner(partner)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedPartner?.id === partner.id
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{partner.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {partner.type === 'fournisseur' ? 'Fournisseur' : 'Laboratoire'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Aucun partenaire trouvé
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {selectedPartner && (
            <>
              {/* Informations du partenaire */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nom d'affichage</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nom visible dans le chat"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@partenaire.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="font-medium">Permissions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Chat activé</Label>
                      <p className="text-sm text-muted-foreground">
                        Le partenaire peut recevoir et envoyer des messages
                      </p>
                    </div>
                    <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Peut initier des conversations</Label>
                      <p className="text-sm text-muted-foreground">
                        Le partenaire peut démarrer de nouvelles discussions
                      </p>
                    </div>
                    <Switch 
                      checked={canInitiateConversation} 
                      onCheckedChange={setCanInitiateConversation} 
                    />
                  </div>
                </div>
              </div>

              {/* Sélection des canaux */}
              <div className="space-y-4">
                <Label>Canaux autorisés</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      onClick={() => handleToggleChannel(channel.id)}
                      className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                        selectedChannels.includes(channel.id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">{channel.name}</span>
                    </div>
                  ))}
                </div>
                {channels.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun canal disponible</p>
                )}
              </div>

              {/* Message d'invitation */}
              <div className="space-y-2">
                <Label htmlFor="message">Message d'invitation (optionnel)</Label>
                <Textarea
                  id="message"
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  placeholder="Écrivez un message personnalisé pour le partenaire..."
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedPartner}>
            <Send className="h-4 w-4 mr-2" />
            Envoyer l'invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerChatInvitationDialog;
