import { Component, signal, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

interface Msg { from: 'user' | 'bot'; text: string; time: string; typing?: boolean; source?: string; }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  template: `
    <!-- FAB -->
    <button class="cb-fab" (click)="toggle()" [class.open]="open()" title="MediAssist IA">
      <i class="fa fa-robot"   *ngIf="!open()"></i>
      <i class="fa fa-xmark"  *ngIf="open()"></i>
      <span class="cb-notif" *ngIf="unread > 0 && !open()">{{ unread }}</span>
    </button>

    <!-- PANEL -->
    <div class="cb-panel" [class.visible]="open()">

      <!-- HEADER -->
      <div class="cb-header">
        <div class="cb-header-left">
          <div class="cb-bot-av"><i class="fa fa-robot"></i></div>
          <div>
            <div class="cb-bot-name">MediAssist IA</div>
            <div class="cb-bot-status">
              <span class="cb-pulse"></span>
              <span>Assistant intelligent</span>
            </div>
          </div>
        </div>
        <div class="cb-header-actions">
          <button class="cb-hbtn" (click)="clearMessages()" title="Effacer"><i class="fa fa-trash-can"></i></button>
          <button class="cb-hbtn" (click)="toggle()"        title="Fermer"> <i class="fa fa-chevron-down"></i></button>
        </div>
      </div>

      <!-- ROLE BADGE -->
      <div class="cb-role-bar">
        <span class="cb-role-badge" [class]="roleBadgeClass()">
          <i [class]="roleIcon()"></i> {{ roleLabel() }}
        </span>
        <span class="cb-role-hint">Contexte personnalisé pour votre espace</span>
      </div>

      <!-- SUGGESTIONS -->
      <div class="cb-suggestions" *ngIf="messages().length <= 1">
        <button class="cb-chip" *ngFor="let s of suggestions()" (click)="sendText(s.text)">
          <i [class]="s.icon"></i> {{ s.label }}
        </button>
      </div>

      <!-- MESSAGES -->
      <div class="cb-messages" #scrollContainer>
        <div *ngFor="let m of messages()"
             class="cb-wrap" [class.user-wrap]="m.from==='user'">
          <div class="cb-bubble" [class.user]="m.from==='user'" [class.bot]="m.from==='bot'">
            <div class="cb-text" [innerHTML]="formatText(m.text)" *ngIf="!m.typing"></div>
            <div class="cb-typing-dots" *ngIf="m.typing">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div class="cb-meta" [class.user-meta]="m.from==='user'">
            {{ m.time }}
            <span class="cb-source" *ngIf="m.source === 'GROQ'">· IA</span>
          </div>
        </div>
      </div>

      <!-- INPUT -->
      <div class="cb-footer">
        <div class="cb-input-row">
          <input
            class="cb-input"
            [(ngModel)]="draft"
            (keyup.enter)="send()"
            [placeholder]="inputPlaceholder()"
            [disabled]="busy"
            maxlength="500"
          >
          <button class="cb-send" (click)="send()" [disabled]="!draft.trim() || busy">
            <i class="fa fa-paper-plane" *ngIf="!busy"></i>
            <span class="cb-spin" *ngIf="busy"></span>
          </button>
        </div>
        <div class="cb-disclaimer">Réponses générées par IA — non substituables à un avis médical.</div>
      </div>

    </div>
  `,
  styles: [`
    /* ── FAB ──────────────────────────────────── */
    .cb-fab {
      position:fixed; bottom:28px; right:28px; z-index:1000;
      width:54px; height:54px; border-radius:50%; border:none; cursor:pointer;
      background:linear-gradient(135deg,#0f6cbd,#00b389);
      color:#fff; font-size:20px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 6px 24px rgba(15,108,189,.45);
      transition:transform .25s, box-shadow .25s;
    }
    .cb-fab:hover { transform:scale(1.1); box-shadow:0 8px 32px rgba(15,108,189,.6); }
    .cb-fab.open  { background:#64748b; box-shadow:0 4px 16px rgba(0,0,0,.25); }
    .cb-notif {
      position:absolute; top:-4px; right:-4px;
      width:20px; height:20px; border-radius:50%;
      background:#ef4444; color:#fff; font-size:10px; font-weight:800;
      display:flex; align-items:center; justify-content:center;
      border:2px solid #fff;
    }

    /* ── PANEL ────────────────────────────────── */
    .cb-panel {
      position:fixed; bottom:94px; right:28px; z-index:999;
      width:390px; max-height:600px;
      border-radius:22px; overflow:hidden;
      background:var(--surface,#fff);
      border:1.5px solid var(--border,#e2e8f0);
      box-shadow:0 24px 64px rgba(0,0,0,.18);
      display:flex; flex-direction:column;
      opacity:0; pointer-events:none;
      transform:translateY(18px) scale(.97);
      transition:opacity .25s, transform .25s;
    }
    .cb-panel.visible { opacity:1; pointer-events:all; transform:translateY(0) scale(1); }

    /* ── HEADER ───────────────────────────────── */
    .cb-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 16px;
      background:linear-gradient(135deg,#0f6cbd,#00b389);
      flex-shrink:0;
    }
    .cb-header-left { display:flex; align-items:center; gap:10px; }
    .cb-bot-av {
      width:38px; height:38px; border-radius:12px;
      background:rgba(255,255,255,.2);
      display:flex; align-items:center; justify-content:center;
      font-size:18px; color:#fff;
    }
    .cb-bot-name   { font-size:14px; font-weight:800; color:#fff; }
    .cb-bot-status {
      display:flex; align-items:center; gap:5px;
      font-size:11px; color:rgba(255,255,255,.8); margin-top:2px;
    }
    .cb-pulse {
      width:7px; height:7px; border-radius:50%; background:#4ade80;
      box-shadow:0 0 0 2px rgba(74,222,128,.3);
      animation:pulse 1.8s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

    .cb-header-actions { display:flex; gap:6px; }
    .cb-hbtn {
      width:30px; height:30px; border-radius:8px; border:none;
      background:rgba(255,255,255,.15); color:#fff; cursor:pointer; font-size:13px;
      display:flex; align-items:center; justify-content:center; transition:background .2s;
    }
    .cb-hbtn:hover { background:rgba(255,255,255,.3); }

    /* ── ROLE BAR ─────────────────────────────── */
    .cb-role-bar {
      display:flex; align-items:center; gap:10px;
      padding:8px 14px; background:var(--bg,#f8fafc);
      border-bottom:1.5px solid var(--border,#e2e8f0); flex-shrink:0;
    }
    .cb-role-badge {
      display:inline-flex; align-items:center; gap:5px;
      padding:3px 10px; border-radius:999px; font-size:11px; font-weight:800;
    }
    .cb-role-badge i { font-size:10px; }
    .badge-medecin    { background:#dbeafe; color:#1d4ed8; }
    .badge-admin      { background:#fee2e2; color:#b91c1c; }
    .badge-secretaire { background:#fef9c3; color:#854d0e; }
    .badge-patient    { background:#dcfce7; color:#15803d; }
    .badge-labo       { background:#f3e8ff; color:#7e22ce; }
    .cb-role-hint { font-size:10.5px; color:var(--text-muted,#94a3b8); }

    /* ── SUGGESTIONS ──────────────────────────── */
    .cb-suggestions {
      display:flex; flex-wrap:wrap; gap:6px;
      padding:10px 12px 6px; border-bottom:1px solid var(--border,#e2e8f0); flex-shrink:0;
    }
    .cb-chip {
      display:flex; align-items:center; gap:5px;
      padding:5px 11px; border-radius:999px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--bg,#f8fafc); color:var(--text,#0f172a);
      font-size:11.5px; font-weight:600; cursor:pointer; transition:all .15s;
    }
    .cb-chip i { font-size:10px; }
    .cb-chip:hover { background:#0f6cbd; color:#fff; border-color:#0f6cbd; }

    /* ── MESSAGES ─────────────────────────────── */
    .cb-messages {
      flex:1; overflow-y:auto; padding:14px 12px;
      display:flex; flex-direction:column; gap:10px;
      scroll-behavior:smooth;
    }
    .cb-messages::-webkit-scrollbar { width:4px; }
    .cb-messages::-webkit-scrollbar-thumb { background:var(--border,#e2e8f0); border-radius:99px; }

    .cb-wrap      { display:flex; flex-direction:column; max-width:86%; }
    .user-wrap    { align-self:flex-end; align-items:flex-end; }

    .cb-bubble {
      padding:10px 14px; border-radius:16px; font-size:13.5px; line-height:1.6;
      word-break:break-word;
    }
    .cb-bubble.bot {
      background:var(--bg,#f0f4f8); color:var(--text,#0f172a);
      border-bottom-left-radius:4px;
    }
    .cb-bubble.user {
      background:linear-gradient(135deg,#0f6cbd,#00b389);
      color:#fff; border-bottom-right-radius:4px;
    }
    .cb-text { white-space:pre-line; }

    .cb-meta { font-size:10.5px; color:var(--text-muted,#94a3b8); margin-top:3px; padding:0 4px; }
    .user-meta { text-align:right; }
    .cb-source { color:#0f6cbd; font-weight:700; }

    /* typing dots */
    .cb-typing-dots { display:flex; gap:4px; padding:2px; }
    .cb-typing-dots span {
      width:7px; height:7px; border-radius:50%; background:#94a3b8;
      animation:bounce .9s infinite;
    }
    .cb-typing-dots span:nth-child(2) { animation-delay:.15s; }
    .cb-typing-dots span:nth-child(3) { animation-delay:.3s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    /* ── FOOTER ───────────────────────────────── */
    .cb-footer {
      padding:10px 12px 12px; border-top:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); flex-shrink:0;
    }
    .cb-input-row { display:flex; gap:8px; margin-bottom:6px; }
    .cb-input {
      flex:1; padding:10px 14px; border-radius:12px;
      border:1.5px solid var(--border,#e2e8f0);
      background:var(--bg,#f0f4f8); color:var(--text,#0f172a);
      font-size:13.5px; outline:none; transition:border-color .2s;
    }
    .cb-input:focus { border-color:#0f6cbd; }
    .cb-input::placeholder { color:var(--text-muted,#94a3b8); }
    .cb-send {
      width:40px; height:40px; border-radius:11px; flex-shrink:0; border:none;
      background:linear-gradient(135deg,#0f6cbd,#00b389);
      color:#fff; cursor:pointer; font-size:15px;
      display:flex; align-items:center; justify-content:center; transition:all .2s;
    }
    .cb-send:hover:not(:disabled) { opacity:.9; transform:scale(1.05); }
    .cb-send:disabled { opacity:.4; cursor:not-allowed; }
    .cb-spin {
      width:14px; height:14px; border-radius:50%;
      border:2px solid rgba(255,255,255,.4); border-top-color:#fff;
      animation:spin .6s linear infinite;
    }
    @keyframes spin { to{transform:rotate(360deg)} }

    .cb-disclaimer {
      font-size:10px; color:var(--text-muted,#94a3b8); text-align:center; line-height:1.4;
    }
  `]
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollEl!: ElementRef;

  open   = signal(false);
  draft  = '';
  busy   = false;
  unread = 0;

  messages = signal<Msg[]>([{
    from: 'bot',
    text: this.welcomeMsg(),
    time: this.now()
  }]);

  constructor(private api: ApiService, public auth: AuthService, private http: HttpClient) {}

  ngAfterViewChecked(): void { this.scrollToBottom(); }

  toggle(): void {
    this.open.update(v => !v);
    if (this.open()) this.unread = 0;
  }

  sendText(text: string): void { this.draft = text; this.send(); }

  send(): void {
    const text = this.draft.trim();
    if (!text || this.busy) return;
    this.messages.update(l => [...l, { from: 'user', text, time: this.now() }]);
    this.draft = '';
    this.busy  = true;
    this.messages.update(l => [...l, { from: 'bot', text: '', time: '', typing: true }]);

    const role     = this.auth.role() ?? 'PATIENT';
    const userName = this.auth.current()?.prenom ?? '';

    // Appel direct Groq depuis le frontend
    this.api.stats().subscribe({
      next: (stats) => {
        const systemPrompt = this.buildSystemPrompt(role, userName, stats);
        this.callGroq(text, systemPrompt);
      },
      error: () => {
        // Stats non dispo, appeler Groq sans contexte
        const systemPrompt = this.buildSystemPrompt(role, userName, null);
        this.callGroq(text, systemPrompt);
      }
    });
  }

  private callGroq(message: string, systemPrompt: string): void {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_GROQ_API_KEY'
    });

    const body = {
      model: 'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: message }
      ],
      max_tokens: 700,
      temperature: 0.7
    };

    this.http.post<any>('https://api.groq.com/openai/v1/chat/completions', body, { headers }).subscribe({
      next: (res) => {
        this.busy = false;
        const reply = res?.choices?.[0]?.message?.content ?? 'Je n\'ai pas pu répondre.';
        this.messages.update(l => [
          ...l.filter(m => !m.typing),
          { from: 'bot', text: reply, time: this.now(), source: 'GROQ' }
        ]);
        if (!this.open()) this.unread++;
      },
      error: () => {
        this.busy = false;
        // Fallback: appel backend
        this.api.chatbot(message, 'clinique', this.auth.role() ?? 'PATIENT', this.auth.current()?.prenom ?? '').subscribe({
          next: (res) => {
            this.messages.update(l => [
              ...l.filter(m => !m.typing),
              { from: 'bot', text: res.reponse, time: this.now() }
            ]);
          },
          error: () => {
            this.messages.update(l => [
              ...l.filter(m => !m.typing),
              { from: 'bot', text: '⚠️ Service temporairement indisponible.', time: this.now() }
            ]);
          }
        });
      }
    });
  }

  private buildSystemPrompt(role: string, userName: string, stats: any): string {
    const name = userName || 'utilisateur';

    // Contexte commun clinique
    const cliniqueBase = stats ? `
DONNÉES TEMPS RÉEL DE LA CLINIQUE :
- Patients inscrits       : ${stats.patients ?? 0}
- Médecins                : ${stats.medecins ?? 0} (${stats.medecinsDisponibles ?? 0} disponibles)
- Rendez-vous total       : ${stats.rendezVous ?? 0}
  • Planifiés : ${stats.rendezVousPlanifies ?? 0}
  • Confirmés : ${stats.rendezVousConfirmes ?? 0}
  • Terminés  : ${stats.rendezVousTermines ?? 0}
  • Annulés   : ${stats.rendezVousAnnules ?? 0}
- Consultations           : ${stats.consultations ?? 0}
- Ordonnances             : ${stats.ordonnances ?? 0}
- Examens labo            : ${stats.examensTotal ?? 0}
- Factures                : total ${stats.facturesTotal ?? 0}, payées ${stats.facturesPayees ?? 0}
- Revenus encaissés       : ${stats.revenusTotal ?? 0} €
- Taux de confirmation RDV: ${stats.tauxConfirmation ?? 0}%
- Horaires clinique       : Lun-Ven 08h-18h, Sam 09h-13h
` : 'Données cliniques non disponibles pour le moment.';

    switch (role.toUpperCase()) {

      // ── MÉDECIN ──────────────────────────────────────────────────────────
      case 'MEDECIN':
        return `Tu es MediAssist, l'assistant IA médical intégré à la plateforme MediCare.
Tu t'adresses exclusivement au Dr ${name}, médecin de la clinique.

${cliniqueBase}

TON RÔLE AVEC LE MÉDECIN :
1. GESTION CLINIQUE : aide à consulter ses rendez-vous, patients, consultations et examens
2. AIDE MÉDICALE GÉNÉRALE : réponds aux questions sur les pathologies, traitements, protocoles, interactions médicamenteuses
3. RÉDACTION : aide à rédiger des notes de consultation, comptes-rendus, ordonnances types, lettres de référence
4. DIAGNOSTIC DIFFÉRENTIEL : propose des pistes diagnostiques si demandé (jamais définitives)
5. PHARMACOLOGIE : informations sur les médicaments, posologies, contre-indications

RÈGLES STRICTES :
- Tu parles à un MÉDECIN qualifié — adopte un langage médical précis et professionnel
- Utilise la terminologie médicale appropriée
- Ne simplifie pas excessivement — il est expert
- Pour les urgences vitales patient, renvoie vers le 15 (SAMU)
- Ne donne jamais de diagnostic définitif sur un cas réel non examiné
- Si le médecin demande "mes RDV" ou "mon planning", utilise les données ci-dessus
- Réponds TOUJOURS en français`;

      // ── ADMIN ─────────────────────────────────────────────────────────────
      case 'ADMIN':
        return `Tu es MediAssist, l'assistant IA d'administration de la clinique MediCare.
Tu t'adresses à ${name}, administrateur système de la clinique.

${cliniqueBase}

TON RÔLE AVEC L'ADMIN :
1. ANALYSE & REPORTING : analyse les statistiques, identifie les tendances, compare les périodes
2. GESTION DES RESSOURCES : optimisation du planning médecins, taux d'occupation, disponibilités
3. FACTURATION & FINANCES : suivi revenus, factures en attente, taux de paiement
4. GESTION UTILISATEURS : aide pour la création/gestion des comptes, rôles, accès
5. OPTIMISATION : recommandations pour améliorer les performances de la clinique
6. RAPPORTS : génère des synthèses textuelles basées sur les données réelles

RÈGLES :
- Utilise TOUJOURS les données temps réel fournies pour répondre avec précision
- Présente les données sous forme structurée (tableaux, listes) quand pertinent
- Propose des analyses proactives (ex: "Je remarque que le taux d'annulation est élevé...")
- Réponds TOUJOURS en français, de manière concise et orientée décision`;

      // ── SECRÉTAIRE ────────────────────────────────────────────────────────
      case 'SECRETAIRE':
        return `Tu es MediAssist, l'assistant IA de secrétariat médical de la clinique MediCare.
Tu t'adresses à ${name}, secrétaire médicale de la clinique.

${cliniqueBase}

TON RÔLE AVEC LA SECRÉTAIRE :
1. GESTION DES RDV : aide pour planifier, reprogrammer, confirmer ou annuler des rendez-vous
2. ACCUEIL PATIENTS : scripts d'accueil téléphonique, gestion des urgences, priorisation
3. PLANNING MÉDECINS : vérification des disponibilités, créneaux libres, gestion des absences
4. FACTURATION : aide pour créer des factures, suivre les paiements, gérer les relances
5. COMMUNICATION : rédaction de rappels RDV, lettres aux patients, emails professionnels
6. PROCÉDURES : rappels des protocoles d'accueil, gestion des dossiers patients

EXEMPLES DE RÉPONSES ATTENDUES :
- "Pour confirmer le RDV de demain avec Dr Martin, vérifiez le statut dans Planning > Rendez-vous"
- "Pour créer une facture, allez dans Facturation > Nouvelle facture"
- Aide à formuler des messages de rappel aux patients

RÈGLES :
- Adapte ton langage au contexte administratif et médical
- Sois pratique et opérationnel — donne des instructions étape par étape
- Utilise les données réelles pour répondre sur les disponibilités
- Réponds TOUJOURS en français`;

      // ── LABO ──────────────────────────────────────────────────────────────
      case 'LABO':
        return `Tu es MediAssist, l'assistant IA spécialisé pour le laboratoire de la clinique MediCare.
Tu t'adresses à ${name}, technicien(ne) de laboratoire médical.

${cliniqueBase}

TON RÔLE AVEC LE TECHNICIEN LABO :
1. GESTION DES ANALYSES : aide pour gérer la file d'attente des examens, prioriser les urgences
2. RÉFÉRENCE MÉDICALE LABO : valeurs normales de référence pour tous les examens courants (NFS, biochimie, etc.)
3. INTERPRÉTATION DES RÉSULTATS : guide pour l'interprétation des valeurs (sans remplacer le médecin)
4. PROTOCOLES ANALYTIQUES : procédures standard pour les différents types d'analyses
5. RÉDACTION DES RÉSULTATS : aide à formuler des comptes-rendus clairs et structurés
6. NOTIFICATIONS : rappels sur le processus de notification patient/médecin après publication

VALEURS DE RÉFÉRENCE IMPORTANTES (adulte) :
NFS : GR 4.5-5.5 M/µL, Hb 12-16 g/dL, GB 4-10 K/µL, Plaquettes 150-400 K/µL
BIOCHIMIE : Glycémie 0.7-1.1 g/L, Créatinine 6-12 mg/L, Urée 0.15-0.45 g/L
LIPIDES : Cholestérol total <2 g/L, LDL <1.6 g/L, HDL >0.4 g/L, TG <1.5 g/L
FOIE : ASAT <40 UI/L, ALAT <41 UI/L, GGT <50 UI/L
THYROÏDE : TSH 0.27-4.2 mUI/L, T4L 12-22 pmol/L
IONOGRAMME : Na 136-145 mmol/L, K 3.5-5 mmol/L, Cl 98-106 mmol/L

WORKFLOW PUBLICATION RÉSULTAT :
1. Saisir les valeurs mesurées avec les unités
2. Comparer aux valeurs de référence
3. Rédiger une conclusion claire
4. Choisir statut "Résultat disponible"
5. La notification est envoyée automatiquement au patient ET au médecin prescripteur

RÈGLES :
- Utilise la terminologie biologique et médicale précise
- Aide à rédiger des résultats structurés et complets
- Rappelle toujours que l'interprétation clinique finale appartient au médecin
- Pour les valeurs critiques (panic values), signale l'urgence de contacter le médecin immédiatement
- Réponds TOUJOURS en français`;

      // ── PATIENT ───────────────────────────────────────────────────────────
      default:
        return `Tu es MediAssist, l'assistant santé numérique de la clinique MediCare.
Tu t'adresses à ${name}, patient de la clinique.

INFORMATIONS CLINIQUE :
- Médecins disponibles : ${stats?.medecinsDisponibles ?? 0} sur ${stats?.medecins ?? 0}
- Horaires : Lun-Ven 08h-18h, Sam 09h-13h
- Services : Consultations, Examens, Ordonnances, Facturation

TON RÔLE AVEC LE PATIENT :
1. ORIENTATION : guide pour prendre un rendez-vous, trouver le bon spécialiste
2. INFORMATION SANTÉ : réponses claires sur les symptômes courants, prévention, hygiène de vie
3. NAVIGATION PLATEFORME : explique comment utiliser l'espace patient (RDV, dossier, examens, factures)
4. PRÉPARATION EXAMENS : explique comment se préparer pour des analyses (à jeun, etc.)
5. COMPRENDRE LES RÉSULTATS : aide à comprendre les termes médicaux de ses résultats
6. URGENCES : oriente vers les bons services en cas d'urgence

RÈGLES ABSOLUES :
- Utilise un langage SIMPLE, clair et rassurant — pas de jargon médical sans explication
- Tu n'es PAS médecin — tes réponses sont informatives et éducatives UNIQUEMENT
- Ne pose JAMAIS de diagnostic, même partiel
- Pour tout symptôme grave : "Consultez un médecin rapidement" ou "Appelez le 15 si urgence vitale"
- Sois empathique, chaleureux et rassurant
- Réponds TOUJOURS en français`;
    }
  }

  clearMessages(): void {
    this.messages.set([{ from: 'bot', text: this.welcomeMsg(), time: this.now() }]);
  }

  formatText(text: string): string {
    return (text ?? '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  // ── Role-specific ──────────────────────────────────────

  suggestions(): { icon: string; label: string; text: string }[] {
    const role = this.auth.role();
    if (role === 'MEDECIN') return [
      { icon:'fa fa-calendar-check', label:'Mes RDV',           text:'Combien de rendez-vous ai-je planifiés ?' },
      { icon:'fa fa-users',          label:'Mes patients',       text:'Donne-moi un résumé de mon activité' },
      { icon:'fa fa-stethoscope',    label:'Aide médicale',      text:'Quels sont les symptômes courants d\'une angine ?' },
      { icon:'fa fa-file-medical',   label:'Rédiger une note',   text:'Aide-moi à rédiger une note de consultation' },
      { icon:'fa fa-clock',          label:"Aujourd'hui",        text:"Quels sont les rendez-vous d'aujourd'hui ?" },
    ];
    if (role === 'ADMIN') return [
      { icon:'fa fa-chart-line', label:'Statistiques',  text:'Donne-moi un résumé des statistiques de la clinique' },
      { icon:'fa fa-users',      label:'Patients',       text:'Combien de patients sont inscrits ?' },
      { icon:'fa fa-user-doctor',label:'Médecins',       text:'Liste les médecins disponibles' },
      { icon:'fa fa-calendar',   label:'RDV du jour',    text:"Quels sont les rendez-vous d'aujourd'hui ?" },
      { icon:'fa fa-trophy',     label:'Performance',    text:'Quel est le taux de confirmation des rendez-vous ?' },
    ];
    if (role === 'SECRETAIRE') return [
      { icon:'fa fa-calendar-check', label:'RDV planifiés',    text:'Combien de rendez-vous sont planifiés ?' },
      { icon:'fa fa-user-doctor',    label:'Médecins dispo.',  text:'Quels médecins sont disponibles aujourd\'hui ?' },
      { icon:'fa fa-clock',          label:'Horaires',         text:'Quels sont les horaires de la clinique ?' },
    ];
    if (role === 'LABO') return [
      { icon:'fa fa-flask',          label:'Examens en attente', text:'Combien d\'examens sont en attente de résultat ?' },
      { icon:'fa fa-microscope',     label:'Résultats publiés',  text:'Combien de résultats ai-je publié ?' },
      { icon:'fa fa-vials',          label:'Types d\'examens',   text:'Quels sont les types d\'analyses les plus demandés ?' },
      { icon:'fa fa-bell',           label:'Notifications',      text:'Comment fonctionne l\'envoi de notifications aux patients ?' },
      { icon:'fa fa-circle-check',   label:'Validation',         text:'Comment valider et publier un résultat d\'analyse ?' },
    ];
    // PATIENT
    return [
      { icon:'fa fa-calendar-plus',  label:'Prendre RDV',     text:'Comment prendre un rendez-vous ?' },
      { icon:'fa fa-user-doctor',    label:'Médecins',         text:'Quels médecins sont disponibles ?' },
      { icon:'fa fa-clock',          label:'Horaires',         text:'Quels sont les horaires de la clinique ?' },
      { icon:'fa fa-triangle-exclamation', label:'Urgences',  text:'Que faire en cas d\'urgence ?' },
    ];
  }

  welcomeMsg(): string {
    const role = this.auth.role();
    const name = this.auth.current()?.prenom ?? '';
    const greeting = new Date().getHours() < 12 ? 'Bonjour' : 'Bonsoir';
    if (role === 'MEDECIN')
      return `${greeting} Dr ${name} 👋\nJe suis **MediAssist**, votre assistant IA médical.\nJe peux vous aider avec vos rendez-vous, vos patients, des questions médicales générales, ou la rédaction de notes cliniques.\nComment puis-je vous aider aujourd'hui ?`;
    if (role === 'ADMIN')
      return `${greeting} ${name} 👋\nJe suis **MediAssist**, votre assistant IA d'administration.\nJe peux analyser les statistiques de la clinique, répondre à vos questions sur l'activité, et vous aider dans la gestion.\nQue souhaitez-vous savoir ?`;
    if (role === 'SECRETAIRE')
      return `${greeting} ${name} 👋\nJe suis **MediAssist**, votre assistant clinique.\nJe peux vous aider avec les plannings, les disponibilités des médecins et les informations pratiques.\nComment puis-je vous aider ?`;
    if (role === 'LABO')
      return `${greeting} ${name} 👋\nJe suis **MediAssist**, votre assistant laboratoire.\nJe peux vous aider à gérer les analyses, comprendre les protocoles, et optimiser votre flux de travail.\nComment puis-je vous aider ?`;
    return `${greeting} ${name} 👋\nJe suis **MediAssist**, votre assistant santé de la clinique MediCare.\nPosez vos questions sur nos services, médecins ou rendez-vous.`;
  }

  roleLabel(): string {
    const m: Record<string,string> = { MEDECIN:'Espace Médecin', ADMIN:'Administration', SECRETAIRE:'Secrétariat', PATIENT:'Espace Patient', LABO:'Laboratoire' };
    return m[this.auth.role()??'PATIENT'] ?? 'Espace Patient';
  }
  roleIcon(): string {
    const m: Record<string,string> = { MEDECIN:'fa fa-user-doctor', ADMIN:'fa fa-shield-halved', SECRETAIRE:'fa fa-briefcase', PATIENT:'fa fa-user', LABO:'fa fa-flask' };
    return m[this.auth.role()??'PATIENT'] ?? 'fa fa-user';
  }
  roleBadgeClass(): string {
    const m: Record<string,string> = { MEDECIN:'cb-role-badge badge-medecin', ADMIN:'cb-role-badge badge-admin', SECRETAIRE:'cb-role-badge badge-secretaire', PATIENT:'cb-role-badge badge-patient', LABO:'cb-role-badge badge-labo' };
    return m[this.auth.role()??'PATIENT'] ?? 'cb-role-badge badge-patient';
  }
  modelName(): string { return 'Llama 3'; }
    inputPlaceholder(): string {
    if (this.auth.role() === 'MEDECIN') return 'Question médicale, note clinique...';
    if (this.auth.role() === 'ADMIN') return 'Statistiques, gestion, analyse...';
    if (this.auth.role() === 'LABO') return 'Protocole, examen, résultat...';
    return 'Posez votre question...';
  }

  private scrollToBottom(): void {
    try { const el = this.scrollEl?.nativeElement; if (el) el.scrollTop = el.scrollHeight; } catch {}
  }
  private now(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  }
}
