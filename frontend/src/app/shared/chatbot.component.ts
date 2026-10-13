import { Component, signal, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
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
            <span class="cb-source" *ngIf="m.source === 'GROQ'">· modèle IA</span>
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

  constructor(private api: ApiService, public auth: AuthService) {}

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

    // La clé de l'API IA reste côté serveur : le navigateur n'appelle que le backend.
    this.api.chatbot(text).subscribe({
      next: (res) => {
        this.busy = false;
        this.messages.update(l => [
          ...l.filter(m => !m.typing),
          { from: 'bot', text: res.reponse, time: this.now(), source: res.source }
        ]);
        if (!this.open()) this.unread++;
      },
      error: () => {
        this.busy = false;
        this.messages.update(l => [
          ...l.filter(m => !m.typing),
          { from: 'bot', text: 'Le service est momentanément indisponible. Veuillez réessayer dans quelques instants.', time: this.now() }
        ]);
      }
    });
  }

  clearMessages(): void {
    this.messages.set([{ from: 'bot', text: this.welcomeMsg(), time: this.now() }]);
  }

  formatText(text: string): string {
    const echappe = (text ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return echappe
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
    if (role === 'PHARMACIEN') return [
      { icon:'fa fa-user-doctor', label:'Équipe médicale', text:'Quels médecins exercent à la clinique ?' },
      { icon:'fa fa-clock',       label:'Horaires',        text:'Quels sont les horaires de la clinique ?' },
      { icon:'fa fa-circle-info', label:'Aide',            text:'Que peux-tu faire pour moi ?' },
    ];
    if (!role) return [
      { icon:'fa fa-user-doctor', label:'Nos médecins', text:'Quels médecins exercent à la clinique ?' },
      { icon:'fa fa-clock',       label:'Horaires',     text:'Quels sont les horaires de la clinique ?' },
      { icon:'fa fa-user-plus',   label:'Créer un compte', text:'Comment créer mon compte patient ?' },
      { icon:'fa fa-triangle-exclamation', label:'Urgences', text:'Que faire en cas d\'urgence ?' },
    ];
    // PATIENT
    return [
      { icon:'fa fa-stethoscope',    label:'Pré-diagnostic',  text:'J\'ai des symptômes, quel spécialiste consulter ?' },
      { icon:'fa fa-calendar-plus',  label:'Prendre RDV',     text:'Comment prendre un rendez-vous ?' },
      { icon:'fa fa-user-doctor',    label:'Médecins',         text:'Quels médecins sont disponibles ?' },
      { icon:'fa fa-clock',          label:'Horaires',         text:'Quels sont les horaires de la clinique ?' },
      { icon:'fa fa-triangle-exclamation', label:'Urgences',  text:'Que faire en cas d\'urgence ?' },
    ];
  }

  welcomeMsg(): string {
    const role = this.auth.role();
    const name = this.auth.current()?.prenom ?? '';
    const h = new Date().getHours();
    const greeting = h >= 18 || h < 5 ? 'Bonsoir' : 'Bonjour';
    if (role === 'MEDECIN')
      return `${greeting} Dr ${name},\nJe suis **MediAssist**, l'assistant des médecins.\nJe peux vous aider sur vos rendez-vous, l'équipe médicale, des questions médicales générales ou la rédaction de notes.`;
    if (role === 'ADMIN')
      return `${greeting} ${name},\nJe suis **MediAssist**, l'assistant d'administration.\nJe peux résumer l'activité de la clinique et répondre à vos questions de gestion.`;
    if (role === 'SECRETAIRE')
      return `${greeting} ${name},\nJe suis **MediAssist**, l'assistant du secrétariat.\nJe peux vous aider sur les rendez-vous, les disponibilités des médecins et les informations pratiques.`;
    if (role === 'LABO')
      return `${greeting} ${name},\nJe suis **MediAssist**, l'assistant du laboratoire.\nJe peux vous renseigner sur l'organisation de la clinique et le circuit des analyses.`;
    if (role === 'PHARMACIEN')
      return `${greeting} ${name},\nJe suis **MediAssist**, l'assistant de la pharmacie.\nJe peux vous renseigner sur l'organisation de la clinique et l'équipe médicale.`;
    if (role === 'PATIENT')
      return `${greeting} ${name},\nJe suis **MediAssist**, l'assistant santé de la clinique MediCare.\nPosez vos questions sur nos services, vos rendez-vous ou utilisez le pré-diagnostic pour savoir quel spécialiste consulter.`;
    return `${greeting},\nJe suis **MediAssist**, l'assistant d'accueil de la clinique MediCare.\nJe peux vous présenter nos spécialités, nos horaires et la création d'un compte patient.`;
  }

  private static readonly ROLES: Record<string, { label: string; icon: string; badge: string }> = {
    MEDECIN:    { label: 'Espace Médecin',  icon: 'fa fa-user-doctor', badge: 'badge-medecin' },
    ADMIN:      { label: 'Administration',  icon: 'fa fa-shield-halved', badge: 'badge-admin' },
    SECRETAIRE: { label: 'Secrétariat',     icon: 'fa fa-briefcase', badge: 'badge-secretaire' },
    PATIENT:    { label: 'Espace Patient',  icon: 'fa fa-user', badge: 'badge-patient' },
    LABO:       { label: 'Laboratoire',     icon: 'fa fa-flask', badge: 'badge-labo' },
    PHARMACIEN: { label: 'Pharmacie',       icon: 'fa fa-prescription-bottle-medical', badge: 'badge-labo' },
  };
  private roleInfo() {
    return ChatbotComponent.ROLES[this.auth.role() ?? ''] ?? { label: 'Accueil', icon: 'fa fa-circle-info', badge: 'badge-patient' };
  }
  roleLabel(): string { return this.roleInfo().label; }
  roleIcon(): string { return this.roleInfo().icon; }
  roleBadgeClass(): string { return 'cb-role-badge ' + this.roleInfo().badge; }
  inputPlaceholder(): string {
    if (this.auth.role() === 'MEDECIN') return 'Question médicale, note clinique...';
    if (this.auth.role() === 'ADMIN') return 'Activité, gestion, organisation...';
    return 'Posez votre question...';
  }

  private scrollToBottom(): void {
    try { const el = this.scrollEl?.nativeElement; if (el) el.scrollTop = el.scrollHeight; } catch {}
  }
  private now(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  }
}
