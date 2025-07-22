

                    <div className="space-y-2">
                      <Label htmlFor="reference_agent" className="text-sm font-medium">
                        Référence agent
                      </Label>
                      <Input
                        id="reference_agent"
                        type="text"
                        placeholder="REF001"
                        value={formData.reference_agent}
                        onChange={(e) => handleInputChange('reference_agent', e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                >
                  {isLoading ? "Création en cours..." : "Créer ma pharmacie"}
                </Button>
              </form>

              <div className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  Vous avez déjà un compte ?
                </div>
                <Link to="/pharmacy-connection">
                  <Button variant="outline" className="w-full h-11 font-medium">
                    Se connecter
                  </Button>
                </Link>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}