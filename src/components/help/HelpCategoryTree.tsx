import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { HelpCategory, HelpArticle } from '@/hooks/useHelpCenter';
import { cn } from '@/lib/utils';

interface HelpCategoryTreeProps {
  categories: HelpCategory[];
  articles: HelpArticle[];
  onCategorySelect?: (category: HelpCategory) => void;
  onArticleSelect?: (article: HelpArticle) => void;
  selectedCategoryId?: string;
}

interface CategoryNodeProps {
  category: HelpCategory;
  categories: HelpCategory[];
  articles: HelpArticle[];
  level: number;
  onCategorySelect?: (category: HelpCategory) => void;
  onArticleSelect?: (article: HelpArticle) => void;
  selectedCategoryId?: string;
}

function CategoryNode({ 
  category, 
  categories, 
  articles, 
  level,
  onCategorySelect,
  onArticleSelect,
  selectedCategoryId
}: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const childCategories = categories.filter(c => c.parent_id === category.id);
  const categoryArticles = articles.filter(a => a.category_id === category.id);
  const hasChildren = childCategories.length > 0 || categoryArticles.length > 0;
  const isSelected = selectedCategoryId === category.id;

  return (
    <div className="space-y-1">
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        className={cn(
          "w-full justify-start h-auto py-2",
          level > 0 && "ml-4"
        )}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          onCategorySelect?.(category);
        }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 mr-1 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1 shrink-0" />
          )
        ) : (
          <span className="w-5" />
        )}
        
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 mr-2 text-primary shrink-0" />
        ) : (
          <Folder className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
        )}
        
        <span className="flex-1 text-left truncate">{category.name}</span>
        
        {(childCategories.length > 0 || categoryArticles.length > 0) && (
          <Badge variant="secondary" className="ml-2 shrink-0">
            {childCategories.length + categoryArticles.length}
          </Badge>
        )}
      </Button>

      {isExpanded && (
        <div className="pl-4 space-y-1">
          {/* Child categories */}
          {childCategories.map(child => (
            <CategoryNode
              key={child.id}
              category={child}
              categories={categories}
              articles={articles}
              level={level + 1}
              onCategorySelect={onCategorySelect}
              onArticleSelect={onArticleSelect}
              selectedCategoryId={selectedCategoryId}
            />
          ))}
          
          {/* Articles in this category */}
          {categoryArticles.map(article => (
            <Button
              key={article.id}
              variant="ghost"
              className="w-full justify-start h-auto py-2 ml-4 text-sm"
              onClick={() => onArticleSelect?.(article)}
            >
              <span className="w-5" />
              <span className="truncate">{article.title}</span>
              {article.is_featured && (
                <Badge variant="outline" className="ml-2 text-xs">
                  ★
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function HelpCategoryTree({ 
  categories, 
  articles, 
  onCategorySelect,
  onArticleSelect,
  selectedCategoryId
}: HelpCategoryTreeProps) {
  // Get root categories (no parent)
  const rootCategories = categories.filter(c => !c.parent_id);

  if (rootCategories.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Aucune catégorie disponible
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rootCategories.map(category => (
        <CategoryNode
          key={category.id}
          category={category}
          categories={categories}
          articles={articles}
          level={0}
          onCategorySelect={onCategorySelect}
          onArticleSelect={onArticleSelect}
          selectedCategoryId={selectedCategoryId}
        />
      ))}
    </div>
  );
}
