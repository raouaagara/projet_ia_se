# Fichier: connexion.feature
# Spécification fonctionnelle en Gherkin pour la fonctionnalité de connexion
# Traduite depuis la User Story : "Connexion de l'utilisateur"

Feature: Connexion de l'utilisateur
  En tant que utilisateur enregistré
  Je veux me connecter à mon compte en utilisant mon email et mon mot de passe
  Afin d'accéder à mon tableau de bord personnel

  # ---------------------------------------------------------------------------
  # Scénario 1 : Connexion réussie avec des identifiants valides
  # Critère d'acceptance : si les identifiants sont corrects → redirection /dashboard
  # ---------------------------------------------------------------------------
  Scenario: Connexion réussie avec des identifiants valides
    Given un utilisateur enregistré avec l'email "utilisateur@exemple.com" et le mot de passe "MotDePasse123"
    When il soumet le formulaire de connexion avec l'email "utilisateur@exemple.com" et le mot de passe "MotDePasse123"
    Then il est redirigé vers "/dashboard"
    And il voit son tableau de bord personnel

  # ---------------------------------------------------------------------------
  # Scénario 2 : Échec de connexion avec un mot de passe incorrect
  # Critère d'acceptance : si le mot de passe est incorrect → message d'erreur
  # ---------------------------------------------------------------------------
  Scenario: Échec de connexion avec un mot de passe incorrect
    Given un utilisateur enregistré avec l'email "utilisateur@exemple.com" et le mot de passe "MotDePasse123"
    When il soumet le formulaire de connexion avec l'email "utilisateur@exemple.com" et le mot de passe "MauvaisMotDePasse"
    Then il reste sur la page de connexion
    And il voit le message d'erreur "Email ou mot de passe incorrect."

  # ---------------------------------------------------------------------------
  # Scénario 3 : Échec de connexion avec un email inexistant
  # Critère d'acceptance : si l'email n'existe pas → même message d'erreur
  # ---------------------------------------------------------------------------
  Scenario: Échec de connexion avec un email inexistant
    Given aucun compte n'est associé à l'email "inconnu@exemple.com"
    When il soumet le formulaire de connexion avec l'email "inconnu@exemple.com" et le mot de passe "UnMotDePasse"
    Then il reste sur la page de connexion
    And il voit le message d'erreur "Email ou mot de passe incorrect."

  # ---------------------------------------------------------------------------
  # Scénario 4 : Tentative de connexion avec des champs vides
  # Cas limite : soumission du formulaire sans remplir les champs
  # ---------------------------------------------------------------------------
  Scenario: Tentative de connexion avec des champs vides
    Given l'utilisateur est sur la page de connexion
    When il soumet le formulaire de connexion sans renseigner l'email ni le mot de passe
    Then il reste sur la page de connexion
    And il voit un message indiquant que les champs sont obligatoires

  # ---------------------------------------------------------------------------
  # Scénario 5 : Tentative de connexion avec un format d'email invalide
  # Cas limite : validation du format côté client/serveur
  # ---------------------------------------------------------------------------
  Scenario: Tentative de connexion avec un format d'email invalide
    Given l'utilisateur est sur la page de connexion
    When il soumet le formulaire de connexion avec l'email "pas-un-email" et le mot de passe "MotDePasse123"
    Then il reste sur la page de connexion
    And il voit un message d'erreur indiquant que le format de l'email est invalide
