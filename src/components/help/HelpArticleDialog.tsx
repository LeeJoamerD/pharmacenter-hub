import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Video, 
  Image as ImageIcon,
  ChevronRight,
  BookOpen,
  CheckCircle
} from 'lucide-react';
import { HelpArticle } from '@/hooks/useHelpCenter';
import { useLanguage } from '@/contexts/LanguageContext';

interface HelpArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: HelpArticle | null;
}

export function HelpArticleDialog({ open, onOpenChange, article }: HelpArticleDialogProps) {
  const { t } = useLanguage();
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  if (!article) return null;

  const handleVote = (vote: 'up' | 'down') => {
    setVoted(vote);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{article.title}</DialogTitle>
              {article.category_name && (
                <Badge variant="outline" className="mt-2">
                  {article.category_name}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-6 pt-4 space-y-6">
            {/* Summary */}
            {article.summary && (
              <div className="text-muted-foreground bg-muted/50 p-4 rounded-lg">
                {article.summary}
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {article.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Steps */}
            {article.steps && article.steps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  {t('stepByStep')}
                </h3>
                <div className="space-y-3">
                  {article.steps.map((step: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{step.title}</h4>
                        {step.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        )}
                        {step.image_url && (
                          <img 
                            src={step.image_url} 
                            alt={step.title}
                            className="mt-2 rounded-lg border max-w-full"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {article.video_url && (
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted p-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Tutoriel Vidéo</span>
                </div>
                <div className="aspect-video">
                  <iframe
                    src={article.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Media Gallery */}
            {article.media_urls && article.media_urls.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Captures d'écran
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {article.media_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      className="rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* FAQ Items */}
            {article.faq_items && article.faq_items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Questions fréquentes</h3>
                <div className="space-y-3">
                  {article.faq_items.map((faq: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-primary" />
                        {faq.question}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-2 pl-6">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {article.keywords && article.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* Feedback */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('wasHelpful')}
              </span>
              <div className="flex gap-2">
                <Button
                  variant={voted === 'up' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVote('up')}
                  disabled={voted !== null}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Oui
                </Button>
                <Button
                  variant={voted === 'down' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleVote('down')}
                  disabled={voted !== null}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Non
                </Button>
              </div>
            </div>

            {voted && (
              <p className="text-sm text-center text-muted-foreground">
                Merci pour votre retour !
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
