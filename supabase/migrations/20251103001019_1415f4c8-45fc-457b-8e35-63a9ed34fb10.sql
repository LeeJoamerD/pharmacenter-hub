-- Phase 1: Extension du schéma pour Journalisation (CORRIGÉ)
-- Ajouter les colonnes manquantes dans accounting_journals

-- 1.1 Ajouter sequence_courante et prefixe dans accounting_journals
ALTER TABLE public.accounting_journals
ADD COLUMN IF NOT EXISTS sequence_courante INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS prefixe TEXT;

-- Mettre à jour les préfixes pour les journaux existants
UPDATE public.accounting_journals 
SET prefixe = UPPER(LEFT(code, 2))
WHERE prefixe IS NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_accounting_journals_tenant_type 
ON public.accounting_journals(tenant_id, type);

-- 1.2 Fonction pour générer le prochain numéro de pièce
CREATE OR REPLACE FUNCTION public.generate_piece_number(p_journal_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_journal RECORD;
  v_numero TEXT;
BEGIN
  -- Récupérer le journal avec verrouillage
  SELECT * INTO v_journal
  FROM public.accounting_journals
  WHERE id = p_journal_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Journal non trouvé';
  END IF;
  
  -- Générer le numéro
  v_numero := COALESCE(v_journal.prefixe, 'XX') || 
              LPAD(v_journal.sequence_courante::TEXT, 6, '0');
  
  -- Incrémenter la séquence
  UPDATE public.accounting_journals
  SET sequence_courante = sequence_courante + 1
  WHERE id = p_journal_id;
  
  RETURN v_numero;
END;
$$;

-- 1.3 Enrichissement de ecritures_comptables
ALTER TABLE public.ecritures_comptables
ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public.personnel(id),
ADD COLUMN IF NOT EXISTS validated_by_id UUID REFERENCES public.personnel(id),
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by_id UUID REFERENCES public.personnel(id),
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS montant_total NUMERIC(15,2) DEFAULT 0;

-- Ajouter contrainte pour vérifier le statut
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_ecriture_statut'
  ) THEN
    ALTER TABLE public.ecritures_comptables
    ADD CONSTRAINT check_ecriture_statut 
    CHECK (statut IN ('Brouillon', 'Validé', 'Verrouillé'));
  END IF;
END $$;

-- 1.4 Fonction trigger pour calculer le montant_total automatiquement
CREATE OR REPLACE FUNCTION public.calculate_ecriture_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC(15,2);
  v_ecriture_id UUID;
BEGIN
  -- Déterminer l'ecriture_id selon le type d'opération
  IF TG_OP = 'DELETE' THEN
    v_ecriture_id := OLD.ecriture_id;
  ELSE
    v_ecriture_id := NEW.ecriture_id;
  END IF;

  -- Calculer le total des débits
  SELECT COALESCE(SUM(debit), 0)
  INTO v_total
  FROM public.lignes_ecriture
  WHERE ecriture_id = v_ecriture_id;
  
  -- Mettre à jour la table parent
  UPDATE public.ecritures_comptables
  SET montant_total = v_total
  WHERE id = v_ecriture_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Créer le trigger si inexistant
DROP TRIGGER IF EXISTS trg_update_ecriture_total ON public.lignes_ecriture;
CREATE TRIGGER trg_update_ecriture_total
AFTER INSERT OR UPDATE OR DELETE ON public.lignes_ecriture
FOR EACH ROW
EXECUTE FUNCTION public.calculate_ecriture_total();

-- 1.5 Vue pour faciliter les requêtes (NOM DE COLONNE CORRIGÉ)
CREATE OR REPLACE VIEW public.v_ecritures_avec_details AS
SELECT 
  e.id,
  e.tenant_id,
  e.numero_piece,
  e.date_ecriture,
  e.libelle,
  e.reference_type,
  e.reference_id,
  e.statut,
  e.montant_total,
  e.created_at,
  e.updated_at,
  j.code as journal_code,
  j.name as journal_name,
  j.type as journal_type,
  creator.prenoms || ' ' || creator.noms as created_by,
  e.created_by_id,
  validator.prenoms || ' ' || validator.noms as validated_by,
  e.validated_by_id,
  e.validated_at,
  locker.prenoms || ' ' || locker.noms as locked_by,
  e.locked_by_id,
  e.locked_at,
  ex.libelle_exercice as exercice_name,
  ex.date_debut as exercice_debut,
  ex.date_fin as exercice_fin,
  e.exercice_id,
  e.journal_id
FROM public.ecritures_comptables e
LEFT JOIN public.accounting_journals j ON e.journal_id = j.id
LEFT JOIN public.personnel creator ON e.created_by_id = creator.id
LEFT JOIN public.personnel validator ON e.validated_by_id = validator.id
LEFT JOIN public.personnel locker ON e.locked_by_id = locker.id
LEFT JOIN public.exercices_comptables ex ON e.exercice_id = ex.id;

-- Activer RLS sur la vue
ALTER VIEW public.v_ecritures_avec_details SET (security_invoker = true);

-- 1.6 Fonction pour valider l'équilibre
CREATE OR REPLACE FUNCTION public.validate_ecriture_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_total_debit NUMERIC(15,2);
  v_total_credit NUMERIC(15,2);
BEGIN
  -- Calculer les totaux
  SELECT 
    COALESCE(SUM(debit), 0),
    COALESCE(SUM(credit), 0)
  INTO v_total_debit, v_total_credit
  FROM public.lignes_ecriture
  WHERE ecriture_id = NEW.id;
  
  -- Vérifier l'équilibre (tolérance de 0.01 pour erreurs d'arrondi)
  IF ABS(v_total_debit - v_total_credit) > 0.01 THEN
    RAISE EXCEPTION 'Écriture déséquilibrée : Débit=%, Crédit=%', 
      v_total_debit, v_total_credit;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour validation lors du passage en Validé
DROP TRIGGER IF EXISTS trg_validate_balance_before_validate ON public.ecritures_comptables;
CREATE TRIGGER trg_validate_balance_before_validate
BEFORE UPDATE ON public.ecritures_comptables
FOR EACH ROW
WHEN (NEW.statut = 'Validé' AND OLD.statut = 'Brouillon')
EXECUTE FUNCTION public.validate_ecriture_balance();

-- Permissions
GRANT EXECUTE ON FUNCTION public.generate_piece_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_ecriture_total() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_ecriture_balance() TO authenticated;
GRANT SELECT ON public.v_ecritures_avec_details TO authenticated;