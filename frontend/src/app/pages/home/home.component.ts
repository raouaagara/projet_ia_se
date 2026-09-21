import { Component, OnInit, HostListener, AfterViewInit, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { ChatbotComponent } from '../../shared/chatbot.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, ChatbotComponent],
  template: `

    <!-- ═══════ NAVBAR ═══════ -->
    <nav class="hn hn-solid" [class.hn-scrolled]="scrolled">
      <div class="hn-inner">
        <a class="hn-brand" routerLink="/">
          <img class="brand-logo hn-logo-img" src="assets/logo.png" alt="Medicare">
        </a>
        <div class="hn-links">
          <a href="#services">Services</a>
          <a href="#medecins">Médecins</a>
          <a href="#contact">Contact</a>
        </div>
        <div class="hn-cta">
          <a routerLink="/login" class="hn-login">Se connecter</a>
          <a routerLink="/register" class="hn-rdv"><i class="fa fa-calendar-plus"></i> Prendre RDV</a>
        </div>
        <button class="hn-burger" (click)="menu=!menu"><i [class]="menu?'fa fa-xmark':'fa fa-bars'"></i></button>
      </div>
      <div class="hn-drawer" [class.open]="menu">
        <a href="#services" (click)="menu=false">Services</a>
        <a href="#medecins" (click)="menu=false">Médecins</a>
        <a href="#contact"  (click)="menu=false">Contact</a>
        <a routerLink="/login"    class="hn-login" (click)="menu=false">Se connecter</a>
        <a routerLink="/register" class="hn-rdv"   (click)="menu=false">Prendre RDV</a>
      </div>
    </nav>

    <!-- ═══════ HERO ═══════ -->
    <section class="hh">
      <div class="hh-bg">
        <div class="hh-shape"></div>
        <div class="hh-shape2"></div>
        <div class="hh-orb hh-o1"></div>
        <div class="hh-orb hh-o2"></div>
        <div class="hh-orb hh-o3"></div>
        <!-- Anneaux décoratifs -->
        <div class="hh-deco-ring hh-ring1"></div>
        <div class="hh-deco-ring hh-ring2"></div>
        <div class="hh-deco-ring hh-ring3"></div>
        <!-- Croix décoratives -->
        <div class="hh-deco-plus hh-p1">✕</div>
        <div class="hh-deco-plus hh-p2">✕</div>
        <div class="hh-deco-plus hh-p3">✕</div>
        <!-- Points flottants -->
        <div class="hh-deco-dot hh-d1"></div>
        <div class="hh-deco-dot hh-d2"></div>
        <div class="hh-deco-dot hh-d3"></div>
      </div>
      <div class="hh-inner">
        <div class="hh-left">
          <div class="hh-tag rv"><i class="fa fa-circle-check"></i> Clinique certifiée ISO 9001</div>
          <h1 class="hh-h1">
            La santé<br>
            <span class="hh-accent">réinventée</span><br>
            pour vous
          </h1>
          <p class="hh-p">MediCare vous offre des soins de qualité supérieure avec une équipe médicale experte et une technologie de pointe.</p>
          <div class="hh-btns">
            <a routerLink="/register" class="hh-btn-main"><i class="fa fa-calendar-plus"></i> Prendre rendez-vous</a>
            <a href="#services" class="hh-btn-ghost">Nos services <i class="fa fa-arrow-right"></i></a>
          </div>
          <!-- Badges de confiance -->
          <div class="hh-trust rv">
            <div class="hh-trust-item"><i class="fa fa-circle-check"></i> Données sécurisées</div>
            <div class="hh-trust-item"><i class="fa fa-circle-check"></i> Médecins certifiés</div>
            <div class="hh-trust-item"><i class="fa fa-circle-check"></i> RDV en 2 minutes</div>
          </div>
          <div class="hh-stats rv">
            <div class="hh-stat"><span class="hh-sv">{{ stats.patients || 0 }}+</span><span class="hh-sl">Patients</span></div>
            <div class="hh-sdiv"></div>
            <div class="hh-stat"><span class="hh-sv">{{ stats.medecins || 0 }}+</span><span class="hh-sl">Médecins</span></div>
            <div class="hh-sdiv"></div>
            <div class="hh-stat"><span class="hh-sv">15+</span><span class="hh-sl">Spécialités</span></div>
            <div class="hh-sdiv"></div>
            <div class="hh-stat"><span class="hh-sv">98%</span><span class="hh-sl">Satisfaction</span></div>
          </div>
        </div>
        <div class="hh-right rv" style="position:relative">
          <!-- Cartes flottantes -->
          <div class="hh-float-card hh-fc1">
            <i class="fa fa-star"></i>
            <div>
              <div style="font-size:13px;font-weight:800">Note 4.9/5</div>
              <div style="font-size:11px;color:#94a3b8;font-weight:400">500+ avis patients</div>
            </div>
          </div>
          <div class="hh-float-card hh-fc2">
            <i class="fa fa-shield-halved"></i>
            <div>
              <div style="font-size:13px;font-weight:800">Sécurisé RGPD</div>
              <div style="font-size:11px;color:#94a3b8;font-weight:400">Données chiffrées</div>
            </div>
          </div>
          <div class="hh-phone">
            <div class="hh-phone-bar">
              <div class="hh-phone-dot"></div><div class="hh-phone-dot"></div><div class="hh-phone-dot"></div>
            </div>
            <div class="hh-phone-content">
              <div class="hh-pcard hh-pcard-1">
                <div class="hh-pcard-icon"><i class="fa fa-heart-pulse"></i></div>
                <div>
                  <div class="hh-pcard-t">Bilan de santé</div>
                  <div class="hh-pcard-s">Demain 09h00 — Confirmé</div>
                </div>
                <span class="hh-pcard-ok">✓</span>
              </div>
              <div class="hh-pcard hh-pcard-2">
                <div class="hh-pcard-icon" style="background:#dcfce7;color:#15803d"><i class="fa fa-flask"></i></div>
                <div>
                  <div class="hh-pcard-t">Résultats labo</div>
                  <div class="hh-pcard-s">Disponibles · NFS normal</div>
                </div>
              </div>
              <div class="hh-pcard hh-pcard-3">
                <div class="hh-pcard-icon" style="background:#dbeafe;color:#1d4ed8"><i class="fa fa-user-doctor"></i></div>
                <div>
                  <div class="hh-pcard-t">Dr {{ (medecins[0]?.nom) || 'Martin' }}</div>
                  <div class="hh-pcard-s">{{ (medecins[0]?.specialite) || 'Médecine générale' }}</div>
                </div>
                <span class="hh-dispo" *ngIf="medecins[0]?.disponible">Dispo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ SERVICES ═══════ -->
    <section id="services" class="hs">
      <div class="hs-inner">
        <div class="hs-head rv">
          <span class="hs-pill">Nos services</span>
          <h2 class="hs-h2">Des soins pour chaque besoin</h2>
          <p class="hs-p">Une gamme complète de services médicaux avec des spécialistes dévoués.</p>
        </div>
        <div class="hs-grid">
          <div class="hs-card rv" *ngFor="let s of services; let i=index" [style.animation-delay]="i*0.07+'s'">
            <div class="hs-card-icon" [style.background]="s.bg" [style.color]="s.color">
              <i [class]="'fa '+s.icon"></i>
            </div>
            <h3 class="hs-card-t">{{ s.title }}</h3>
            <p class="hs-card-p">{{ s.desc }}</p>
            <a routerLink="/register" class="hs-card-lnk">Prendre RDV <i class="fa fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ CHIFFRES ═══════ -->
    <section class="hc">
      <div class="hc-inner">
        <div class="hc-stat rv" *ngFor="let s of chiffres; let i=index" [style.animation-delay]="i*0.1+'s'">
          <div class="hc-icon"><i [class]="'fa '+s.icon"></i></div>
          <div class="hc-val">{{ s.val }}</div>
          <div class="hc-lbl">{{ s.lbl }}</div>
        </div>
      </div>
    </section>

    <!-- ═══════ MÉDECINS ═══════ -->
    <section id="medecins" class="hm">
      <div class="hm-inner">
        <div class="hm-head rv">
          <span class="hs-pill">Notre équipe</span>
          <h2 class="hs-h2">Des experts à votre écoute</h2>
        </div>
        <div class="hm-grid">
          <div class="hm-card rv" *ngFor="let m of medecins; let i=index" [style.animation-delay]="i*0.07+'s'">
            <div class="hm-av" [style.background]="specColor(m.specialite)">
              {{ m.prenom?.charAt(0) }}{{ m.nom?.charAt(0) }}
            </div>
            <div class="hm-name">Dr {{ m.prenom }} {{ m.nom }}</div>
            <div class="hm-spec">{{ m.specialite }}</div>
            <div class="hm-faculte" *ngIf="m.faculte"><i class="fa fa-graduation-cap"></i> {{ m.faculte }}</div>
            <div class="hm-hours" *ngIf="m.horaires"><i class="fa fa-clock"></i> {{ m.horaires }}</div>
            <div class="hm-dispo" [class.hm-on]="m.disponible" [class.hm-off]="!m.disponible">
              <i class="fa fa-circle"></i> {{ m.disponible ? 'Disponible' : 'Indisponible' }}
            </div>
            <a routerLink="/register" class="hm-rdv"><i class="fa fa-calendar-plus"></i> Prendre RDV</a>
          </div>
        </div>
        <div class="hm-empty" *ngIf="medecins.length===0">
          <i class="fa fa-circle-notch fa-spin"></i> Chargement…
        </div>
      </div>
    </section>

    <!-- ═══════ COMMENT ÇA MARCHE ═══════ -->
    <section class="hw">
      <div class="hw-inner">
        <div class="hw-head rv">
          <span class="hs-pill">Simple & Rapide</span>
          <h2 class="hs-h2">Prendre soin de soi n'a jamais été aussi simple</h2>
        </div>
        <div class="hw-steps">
          <div class="hw-step rv" *ngFor="let s of steps; let i=index" [style.animation-delay]="i*0.1+'s'">
            <div class="hw-step-num" [style.background]="s.bg" [style.color]="s.color">{{ i+1 }}</div>
            <div class="hw-step-icon" [style.background]="s.bg+'33'" [style.color]="s.color">
              <i [class]="'fa '+s.icon"></i>
            </div>
            <h3 class="hw-step-t">{{ s.title }}</h3>
            <p class="hw-step-p">{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ POURQUOI NOUS ═══════ -->
    <section class="hp">
      <div class="hp-inner">
        <div class="hp-left rv">
          <span class="hs-pill">Pourquoi MediCare</span>
          <h2 class="hs-h2" style="text-align:left">Une clinique moderne<br>au service de votre santé</h2>
          <p class="hs-p" style="text-align:left;margin:0 0 28px">Depuis 2009, MediCare accompagne des milliers de patients tunisiens avec des équipements de pointe et une équipe médicale passionnée.</p>
          <div class="hp-points">
            <div class="hp-pt" *ngFor="let p of pourquoi">
              <div class="hp-pt-icon"><i class="fa fa-check"></i></div>
              <span>{{ p }}</span>
            </div>
          </div>
          <a routerLink="/register" class="hh-btn-main" style="margin-top:28px;display:inline-flex">
            <i class="fa fa-calendar-plus"></i> Prendre rendez-vous
          </a>
        </div>
        <div class="hp-right rv">
          <div class="hp-card-main">
            <div class="hp-card-icon"><i class="fa fa-hospital"></i></div>
            <div>
              <div class="hp-card-t">MediCare Tunis</div>
              <div class="hp-card-s">Clinique médicale de confiance</div>
            </div>
          </div>
          <div class="hp-stats-grid">
            <div class="hp-stat" *ngFor="let s of hpStats">
              <div class="hp-stat-v" [style.color]="s.color">{{ s.val }}</div>
              <div class="hp-stat-l">{{ s.lbl }}</div>
            </div>
          </div>
          <div class="hp-badges">
            <span class="hp-badge"><i class="fa fa-circle" style="font-size:8px;color:#22c55e"></i> Système opérationnel</span>
            <span class="hp-badge"><i class="fa fa-shield-halved"></i> Données sécurisées</span>
            <span class="hp-badge"><i class="fa fa-star" style="color:#f59e0b"></i> Note 4.9/5</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ TEMOIGNAGES ═══════ -->
    <section class="ht">
      <div class="ht-inner">
        <div class="ht-head rv">
          <span class="hs-pill">Témoignages</span>
          <h2 class="hs-h2">Ce que disent nos patients</h2>
        </div>
        <div class="ht-grid">
          <div class="ht-card rv" *ngFor="let t of temoignages; let i=index" [style.animation-delay]="i*0.1+'s'">
            <div class="ht-stars"><i class="fa fa-star" *ngFor="let s of [1,2,3,4,5]"></i></div>
            <p class="ht-txt">"{{ t.text }}"</p>
            <div class="ht-auth">
              <div class="ht-av">{{ t.name.charAt(0) }}</div>
              <div>
                <div class="ht-name">{{ t.name }}</div>
                <div class="ht-role">{{ t.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ CTA ═══════ -->
    <section class="hcta">
      <div class="hcta-deco d1"></div>
      <div class="hcta-deco d2"></div>
      <div class="hcta-inner rv">
        <h2 class="hcta-h2">Prenez soin de votre santé dès aujourd'hui</h2>
        <p class="hcta-p">Créez votre compte gratuitement et accédez à tous nos services en ligne.</p>
        <div class="hcta-btns">
          <a routerLink="/register" class="hcta-btn-main"><i class="fa fa-user-plus"></i> Créer un compte</a>
          <a routerLink="/login"    class="hcta-btn-ghost"><i class="fa fa-right-to-bracket"></i> Se connecter</a>
        </div>
      </div>
    </section>

    <!-- ═══════ CONTACT ═══════ -->
    <section id="contact" class="hco">
      <div class="hco-inner">
        <div class="hco-head rv">
          <span class="hs-pill">Contact</span>
          <h2 class="hs-h2">Nous trouver</h2>
        </div>
        <div class="hco-grid">
          <div class="hco-card rv" *ngFor="let c of contacts; let i=index" [style.animation-delay]="i*0.1+'s'">
            <div class="hco-icon" [style.background]="c.bg"><i [class]="'fa '+c.icon" [style.color]="c.color"></i></div>
            <div class="hco-lbl">{{ c.label }}</div>
            <div class="hco-val">{{ c.value }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ FOOTER ═══════ -->
    <footer class="hf">
      <div class="hf-inner">
        <div class="hf-brand">
          <span class="brand-chip hf-chip"><img class="brand-logo" src="assets/logo.png" alt="Medicare"></span>
          <p class="hf-tag">Votre santé, notre priorité.</p>
        </div>
        <div class="hf-cols">
          <div class="hf-col">
            <div class="hf-col-h">Navigation</div>
            <a href="#services">Services</a>
            <a href="#medecins">Médecins</a>
            <a href="#contact">Contact</a>
          </div>
          <div class="hf-col">
            <div class="hf-col-h">Espace patient</div>
            <a routerLink="/login">Se connecter</a>
            <a routerLink="/register">Créer un compte</a>
          </div>
        </div>
      </div>
      <div class="hf-bottom">© 2025 MediCare Tunis — Tous droits réservés</div>
    </footer>

    <!-- ═══════ CHATBOT PUBLIC ═══════ -->
    <app-chatbot></app-chatbot>
  `,
  styles: [`
    :host { display:block; background:#fff; font-family:'Inter','Plus Jakarta Sans',sans-serif; }
    * { box-sizing:border-box; margin:0; padding:0; }
    a { text-decoration:none; color:inherit; }

    /* Animations */
    @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes orbMove{ 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,15px) scale(1.05)} }
    @keyframes slideIn{ from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }

    .rv { opacity:0; transform:translateY(24px); transition:opacity .6s ease, transform .6s ease; }
    .rv.vis { opacity:1; transform:translateY(0); }

    /* ═══════ NAVBAR ═══════ */
    .hn { position:fixed; top:0; left:0; right:0; z-index:1000; transition:all .3s; }
    /* le hero est clair : la navbar garde toujours le style clair, l'ombre n'apparaît qu'au scroll */
    .hn-solid { background:rgba(255,255,255,.8); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border-bottom:1px solid rgba(226,232,240,.7); }
    .hn-scrolled { background:rgba(255,255,255,.96); box-shadow:0 2px 20px rgba(0,0,0,.08); }
    .hn-inner { max-width:1200px; margin:0 auto; padding:0 24px; height:68px; display:flex; align-items:center; gap:28px; }
    .hn-brand { display:flex; align-items:center; gap:10px; }
    .hn-logo-img { height:44px; }
    .hn-links { display:flex; gap:28px; margin-left:auto; }
    .hn-links a { font-size:14px; font-weight:500; color:rgba(255,255,255,.85); transition:color .2s; }
    .hn-solid .hn-links a { color:#475569; }
    .hn-links a:hover { color:#fff; }
    .hn-solid .hn-links a:hover { color:#1e40af; }
    .hn-cta { display:flex; gap:10px; align-items:center; }
    .hn-login {
      padding:8px 18px; border-radius:9px; font-size:13.5px; font-weight:600;
      color:rgba(255,255,255,.9); border:1.5px solid rgba(255,255,255,.3); transition:all .2s;
    }
    .hn-solid .hn-login { color:#475569; border-color:#e2e8f0; }
    .hn-login:hover { background:rgba(255,255,255,.15); }
    .hn-solid .hn-login:hover { background:#f0f9ff; border-color:#1e40af; color:#1e40af; }
    .hn-rdv {
      display:flex; align-items:center; gap:7px;
      padding:9px 18px; border-radius:9px; font-size:13.5px; font-weight:700;
      background:linear-gradient(135deg,#1e40af,#0f766e); color:#fff;
      box-shadow:0 3px 12px rgba(30,64,175,.35); transition:all .2s;
    }
    .hn-rdv:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(30,64,175,.45); }
    .hn-burger { display:none; background:transparent; border:none; cursor:pointer; font-size:22px; color:#fff; padding:4px; }
    .hn-solid .hn-burger { color:#1e293b; }
    .hn-drawer { display:none; flex-direction:column; gap:6px; padding:16px 24px; background:#fff; box-shadow:0 8px 24px rgba(0,0,0,.1); }
    .hn-drawer.open { display:flex; }
    .hn-drawer a { font-size:15px; font-weight:500; color:#475569; padding:8px 0; }

    /* ═══════ HERO ═══════ */
    .hh {
      min-height:100vh; display:flex; align-items:center;
      background:linear-gradient(135deg,#f0f7ff 0%,#e8f4ff 40%,#f0fdfa 100%);
      position:relative; overflow:visible; padding:100px 24px 80px;
    }
    .hh-bg { position:absolute; inset:0; pointer-events:none; overflow:hidden; border-radius:0; }
    .hh-orb {
      position:absolute; border-radius:50%; filter:blur(60px); opacity:.18;
      animation:orbMove 14s ease-in-out infinite;
    }
    .hh-o1 { width:600px; height:600px; background:#3b82f6; top:-150px; right:-100px; animation-delay:0s; }
    .hh-o2 { width:450px; height:450px; background:#14b8a6; bottom:-100px; left:-80px; animation-delay:5s; }
    .hh-o3 { width:280px; height:280px; background:#818cf8; top:40%; left:45%; animation-delay:10s; }

    /* Anneaux décoratifs */
    .hh-deco-ring {
      position:absolute; border-radius:50%;
      border:1.5px dashed rgba(59,130,246,.15);
    }
    .hh-ring1 { width:550px; height:550px; top:50%; right:-180px; transform:translateY(-50%); animation:spinSlow 30s linear infinite; }
    .hh-ring2 { width:380px; height:380px; top:50%; right:-95px; transform:translateY(-50%); animation:spinSlow 20s linear infinite reverse; }
    @keyframes spinSlow { to { transform:translateY(-50%) rotate(360deg); } }

    /* Forme bleue en arrière-plan */
    .hh-shape {
      position:absolute; top:-60px; right:-60px; width:650px; height:650px;
      background:radial-gradient(circle at 60% 40%, rgba(59,130,246,.08) 0%, transparent 65%);
      border-radius:50%;
    }
    .hh-shape2 {
      position:absolute; bottom:-60px; left:-60px; width:500px; height:500px;
      background:radial-gradient(circle at 40% 60%, rgba(20,184,166,.08) 0%, transparent 65%);
      border-radius:50%;
    }
    /* Bande colorée gauche */
    .hh-strip {
      position:absolute; left:0; top:0; bottom:0; width:5px;
      background:linear-gradient(180deg,#3b82f6,#14b8a6);
    }
    /* Points décoratifs */
    .hh-dots-grid {
      position:absolute; top:80px; right:40%; width:180px; height:180px; opacity:.18;
      background-image:radial-gradient(circle, #3b82f6 1.5px, transparent 1.5px);
      background-size:20px 20px;
    }
    .hh-dots-grid2 {
      position:absolute; bottom:60px; left:5%; width:120px; height:120px; opacity:.12;
      background-image:radial-gradient(circle, #14b8a6 1.5px, transparent 1.5px);
      background-size:16px 16px;
    }

    .hh-inner { max-width:1200px; margin:0 auto; width:100%; display:flex; align-items:center; gap:60px; position:relative; z-index:1; }
    .hh-left { flex:1; }
    .hh-tag {
      display:inline-flex; align-items:center; gap:8px;
      background:#dbeafe; border:1.5px solid #93c5fd;
      color:#1d4ed8; padding:8px 18px; border-radius:999px;
      font-size:13px; font-weight:700; margin-bottom:28px;
      box-shadow:0 2px 8px rgba(59,130,246,.15);
    }
    .hh-h1 {
      font-size:clamp(44px,6vw,72px); font-weight:900; line-height:1.05;
      color:#0f172a; margin-bottom:22px; letter-spacing:-2px;
    }
    .hh-accent {
      background:linear-gradient(135deg,#1d4ed8,#0d9488);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    }
    .hh-p { font-size:17px; color:#475569; line-height:1.8; max-width:500px; margin-bottom:32px; }
    .hh-btns { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:28px; }
    .hh-btn-main {
      display:inline-flex; align-items:center; gap:8px;
      padding:15px 28px; border-radius:12px; font-size:15px; font-weight:800;
      background:linear-gradient(135deg,#1d4ed8,#0d9488); color:#fff;
      box-shadow:0 6px 24px rgba(29,78,216,.35); transition:all .25s;
    }
    .hh-btn-main:hover { transform:translateY(-3px); box-shadow:0 10px 32px rgba(29,78,216,.45); }
    .hh-btn-ghost {
      display:inline-flex; align-items:center; gap:8px;
      padding:15px 28px; border-radius:12px; font-size:15px; font-weight:700;
      background:#fff; color:#334155; border:1.5px solid #cbd5e1; transition:all .25s;
      box-shadow:0 2px 8px rgba(0,0,0,.06);
    }
    .hh-btn-ghost:hover { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }

    /* Badges de confiance */
    .hh-trust { display:flex; align-items:center; gap:20px; margin-bottom:40px; flex-wrap:wrap; }
    .hh-trust-item { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color:#475569; }
    .hh-trust-item i { color:#22c55e; font-size:15px; }

    .hh-stats { display:flex; align-items:center; gap:28px; flex-wrap:wrap; }
    .hh-stat { text-align:center; }
    .hh-sv { display:block; font-size:30px; font-weight:900; color:#0f172a; }
    .hh-sl { font-size:12px; color:#64748b; font-weight:600; margin-top:2px; }
    .hh-sdiv { width:1px; height:42px; background:#cbd5e1; }

    /* Phone + cartes flottantes */
    .hh-right { flex-shrink:0; width:380px; position:relative; padding:40px 50px 40px 20px; }
    .hh-phone {
      background:#fff; border:1.5px solid #e2e8f0; border-radius:24px; overflow:hidden;
      box-shadow:0 32px 64px rgba(29,78,216,.15); animation:float 6s ease-in-out infinite;
      position:relative; z-index:2;
    }
    .hh-phone-bar {
      display:flex; gap:5px; align-items:center;
      padding:12px 16px; border-bottom:1.5px solid #f1f5f9; background:#f8fafc;
    }
    .hh-phone-dot { width:10px; height:10px; border-radius:50%; }
    .hh-phone-dot:nth-child(1) { background:#ef4444; }
    .hh-phone-dot:nth-child(2) { background:#f59e0b; }
    .hh-phone-dot:nth-child(3) { background:#22c55e; }
    .hh-phone-content { padding:16px; display:flex; flex-direction:column; gap:10px; background:#f8fafc; }
    .hh-pcard {
      background:#fff; border:1.5px solid #f1f5f9; border-radius:12px;
      padding:12px 14px; display:flex; align-items:center; gap:12px; transition:all .2s;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .hh-pcard:hover { transform:translateX(4px); box-shadow:0 4px 16px rgba(29,78,216,.1); border-color:#bfdbfe; }
    .hh-pcard-1 { animation:slideIn .6s ease .3s both; }
    .hh-pcard-2 { animation:slideIn .6s ease .5s both; }
    .hh-pcard-3 { animation:slideIn .6s ease .7s both; }
    .hh-pcard-icon {
      width:40px; height:40px; border-radius:11px; flex-shrink:0;
      background:#eff6ff; color:#1d4ed8;
      display:flex; align-items:center; justify-content:center; font-size:17px;
    }
    .hh-pcard-t { font-size:13.5px; font-weight:700; color:#0f172a; }
    .hh-pcard-s { font-size:11.5px; color:#94a3b8; margin-top:2px; }
    .hh-pcard-ok {
      margin-left:auto; width:24px; height:24px; border-radius:50%;
      background:#22c55e; color:#fff; font-size:12px; font-weight:900;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .hh-dispo {
      margin-left:auto; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700;
      background:#dcfce7; color:#15803d; flex-shrink:0;
    }

    /* Cartes flottantes VISIBLES */
    .hh-float-card {
      position:absolute; background:#fff; border-radius:14px; padding:12px 16px;
      box-shadow:0 12px 32px rgba(0,0,0,.14); display:flex; align-items:center; gap:10px;
      font-size:13px; font-weight:700; color:#0f172a; border:1.5px solid #f1f5f9; z-index:10;
    }
    .hh-float-card i { font-size:20px; flex-shrink:0; }
    .hh-fc1 { bottom:10px; left:-20px; animation:float 5s ease-in-out infinite 1s; }
    .hh-fc1 i { color:#f59e0b; }
    .hh-fc2 { top:20px; right:-10px; animation:float 5s ease-in-out infinite 2.5s; }
    .hh-fc2 i { color:#22c55e; }
    .hh-fc3 { top:50%; left:-40px; transform:translateY(-50%); animation:float 4s ease-in-out infinite 0.5s; }
    .hh-fc3 i { color:#0ea5e9; }

    /* ═══════ COMMENT ÇA MARCHE ═══════ */
    .hw { padding:96px 24px; background:#fff; }
    .hw-inner { max-width:1200px; margin:0 auto; }
    .hw-head { text-align:center; margin-bottom:56px; }
    .hw-steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:32px; position:relative; }
    .hw-steps::before {
      content:''; position:absolute; top:36px; left:10%; right:10%; height:2px;
      background:linear-gradient(90deg,#1d4ed8,#0d9488,#7c3aed,#f59e0b);
      opacity:.2; pointer-events:none;
    }
    .hw-step { display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; }
    .hw-step-num {
      width:44px; height:44px; border-radius:50%; font-size:17px; font-weight:900;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
      box-shadow:0 4px 14px rgba(0,0,0,.15);
    }
    .hw-step-icon {
      width:72px; height:72px; border-radius:20px; font-size:28px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 16px rgba(0,0,0,.08);
    }
    .hw-step-t { font-size:16px; font-weight:800; color:#0f172a; }
    .hw-step-p { font-size:14px; color:#64748b; line-height:1.7; }

    /* ═══════ POURQUOI NOUS ═══════ */
    .hp { padding:96px 24px; background:#f8fafc; }
    .hp-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:72px; align-items:center; }
    @media(max-width:900px) { .hp-inner { grid-template-columns:1fr; } }
    .hp-points { display:flex; flex-direction:column; gap:14px; }
    .hp-pt { display:flex; align-items:center; gap:12px; font-size:15px; color:#334155; font-weight:500; }
    .hp-pt-icon {
      width:28px; height:28px; border-radius:8px; background:#dcfce7; color:#15803d;
      display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0;
    }
    .hp-right {
      background:#fff; border-radius:22px; padding:28px;
      border:1.5px solid #e2e8f0; box-shadow:0 8px 36px rgba(29,78,216,.08);
      display:flex; flex-direction:column; gap:20px;
    }
    .hp-card-main {
      display:flex; align-items:center; gap:14px;
      background:linear-gradient(135deg,#eff6ff,#f0fdfa); border-radius:14px; padding:16px 18px;
    }
    .hp-card-icon {
      width:50px; height:50px; border-radius:14px; flex-shrink:0;
      background:linear-gradient(135deg,#1d4ed8,#0d9488);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:22px;
    }
    .hp-card-t { font-size:16px; font-weight:800; color:#0f172a; }
    .hp-card-s { font-size:12px; color:#64748b; margin-top:2px; }
    .hp-stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .hp-stat {
      text-align:center; padding:16px 12px; border-radius:12px;
      background:#f8fafc; border:1.5px solid #f1f5f9;
    }
    .hp-stat-v { font-size:26px; font-weight:900; margin-bottom:4px; }
    .hp-stat-l { font-size:12px; color:#64748b; font-weight:600; }
    .hp-badges { display:flex; flex-wrap:wrap; gap:8px; }
    .hp-badge {
      display:inline-flex; align-items:center; gap:6px; padding:5px 12px;
      border-radius:8px; background:#f1f5f9; color:#475569; font-size:12px; font-weight:600;
    }

    /* ═══════ SECTIONS COMMUNES ═══════ */
    .hs-inner, .hm-inner, .ht-inner, .hco-inner { max-width:1200px; margin:0 auto; }
    .hs-head, .hm-head, .ht-head, .hco-head { text-align:center; margin-bottom:52px; }
    .hs-pill {
      display:inline-block; background:#eff6ff; color:#1e40af;
      padding:6px 16px; border-radius:999px; font-size:12px; font-weight:800;
      text-transform:uppercase; letter-spacing:1px; margin-bottom:14px;
    }
    .hs-h2 { font-size:clamp(28px,4vw,42px); font-weight:900; color:#0f172a; margin-bottom:14px; letter-spacing:-1px; }
    .hs-p { font-size:16px; color:#64748b; max-width:560px; margin:0 auto; line-height:1.8; }

    /* ═══════ SERVICES ═══════ */
    .hs { padding:96px 24px; background:#fff; }
    .hs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:24px; }
    .hs-card {
      background:#fff; border-radius:20px; padding:30px;
      border:1.5px solid #f1f5f9; box-shadow:0 2px 14px rgba(0,0,0,.05);
      transition:all .25s;
    }
    .hs-card:hover { transform:translateY(-6px); box-shadow:0 16px 40px rgba(0,0,0,.1); border-color:#e2e8f0; }
    .hs-card-icon { width:58px; height:58px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:24px; margin-bottom:18px; }
    .hs-card-t { font-size:17px; font-weight:800; color:#0f172a; margin-bottom:10px; }
    .hs-card-p { font-size:14px; color:#64748b; line-height:1.7; margin-bottom:18px; }
    .hs-card-lnk { display:inline-flex; align-items:center; gap:7px; font-size:13.5px; font-weight:700; color:#1e40af; transition:gap .2s; }
    .hs-card-lnk:hover { gap:13px; }

    /* ═══════ CHIFFRES BAND ═══════ */
    .hc { background:linear-gradient(135deg,#1d4ed8,#0d9488); padding:56px 24px; }
    .hc-inner { max-width:1000px; margin:0 auto; display:flex; justify-content:space-around; flex-wrap:wrap; gap:32px; }
    .hc-stat { text-align:center; color:#fff; }
    .hc-icon { font-size:28px; margin-bottom:10px; color:rgba(255,255,255,.8); }
    .hc-val { font-size:38px; font-weight:900; margin-bottom:6px; }
    .hc-lbl { font-size:13px; color:rgba(255,255,255,.75); font-weight:500; }

    /* ═══════ MÉDECINS ═══════ */
    .hm { padding:96px 24px; background:#f8fafc; }
    .hm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:24px; }
    .hm-card {
      background:#fff; border-radius:20px; padding:28px 22px; text-align:center;
      border:1.5px solid #f1f5f9; box-shadow:0 2px 14px rgba(0,0,0,.05);
      display:flex; flex-direction:column; align-items:center; transition:all .25s;
    }
    .hm-card:hover { transform:translateY(-6px); box-shadow:0 16px 40px rgba(0,0,0,.1); }
    .hm-av {
      width:76px; height:76px; border-radius:50%; color:#fff;
      font-size:26px; font-weight:900; display:flex; align-items:center; justify-content:center;
      margin-bottom:14px; box-shadow:0 6px 18px rgba(0,0,0,.15);
    }
    .hm-name { font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px; }
    .hm-spec { font-size:13px; color:#1e40af; font-weight:700; margin-bottom:8px; }
    .hm-faculte { font-size:11.5px; color:#64748b; display:flex; align-items:center; gap:5px; margin-bottom:5px; justify-content:center; }
    .hm-hours { font-size:12px; color:#94a3b8; display:flex; align-items:center; justify-content:center; gap:5px; margin-bottom:10px; }
    .hm-dispo { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; margin-bottom:14px; }
    .hm-on { background:#dcfce7; color:#15803d; }
    .hm-off{ background:#fee2e2; color:#b91c1c; }
    .hm-dispo i { font-size:7px; }
    .hm-rdv {
      width:100%; display:flex; align-items:center; justify-content:center; gap:7px;
      padding:10px; border-radius:11px; background:#eff6ff; color:#1e40af;
      font-size:13.5px; font-weight:700; transition:all .2s;
    }
    .hm-rdv:hover { background:#1e40af; color:#fff; }
    .hm-empty { text-align:center; padding:48px; color:#94a3b8; }

    /* ═══════ TÉMOIGNAGES ═══════ */
    .ht { padding:96px 24px; background:#fff; }
    .ht-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; }
    .ht-card {
      background:#fff; border-radius:20px; padding:28px;
      border:1.5px solid #f1f5f9; box-shadow:0 2px 14px rgba(0,0,0,.05); transition:all .25s;
    }
    .ht-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,.08); }
    .ht-stars { color:#f59e0b; font-size:14px; display:flex; gap:3px; margin-bottom:14px; }
    .ht-txt { font-size:14px; color:#475569; line-height:1.8; margin-bottom:18px; font-style:italic; }
    .ht-auth { display:flex; align-items:center; gap:12px; }
    .ht-av {
      width:42px; height:42px; border-radius:50%;
      background:linear-gradient(135deg,#1e40af,#0f766e); color:#fff;
      font-size:16px; font-weight:800; display:flex; align-items:center; justify-content:center;
    }
    .ht-name { font-size:14px; font-weight:700; color:#0f172a; }
    .ht-role { font-size:12px; color:#94a3b8; }

    /* ═══════ CTA ═══════ */
    .hcta {
      position:relative; overflow:hidden;
      background:linear-gradient(135deg,#eff6ff 0%,#f0fdfa 100%);
      padding:96px 24px; text-align:center;
    }
    .hcta-deco {
      position:absolute; border-radius:50%; filter:blur(80px); opacity:.15; pointer-events:none;
    }
    .d1 { width:500px; height:500px; background:#3b82f6; top:-200px; right:-100px; }
    .d2 { width:400px; height:400px; background:#0d9488; bottom:-150px; left:-100px; }
    .hcta-inner { position:relative; z-index:1; max-width:680px; margin:0 auto; }
    .hcta-h2 { font-size:clamp(28px,4vw,44px); font-weight:900; color:#0f172a; margin-bottom:16px; letter-spacing:-1px; }
    .hcta-p  { font-size:17px; color:#64748b; margin-bottom:36px; line-height:1.7; }
    .hcta-btns { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
    .hcta-btn-main {
      display:inline-flex; align-items:center; gap:8px;
      padding:15px 28px; border-radius:12px; font-size:15px; font-weight:800;
      background:linear-gradient(135deg,#1d4ed8,#0d9488); color:#fff; transition:all .25s;
      box-shadow:0 6px 24px rgba(29,78,216,.3);
    }
    .hcta-btn-main:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(29,78,216,.4); }
    .hcta-btn-ghost {
      display:inline-flex; align-items:center; gap:8px;
      padding:15px 28px; border-radius:12px; font-size:15px; font-weight:700;
      background:#fff; color:#475569; border:1.5px solid #e2e8f0; transition:all .25s;
    }
    .hcta-btn-ghost:hover { background:#eff6ff; border-color:#1d4ed8; color:#1d4ed8; }

    /* ═══════ CONTACT ═══════ */
    .hco { padding:96px 24px; background:#f8fafc; }
    .hco-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:22px; }
    .hco-card {
      background:#fff; border-radius:18px; padding:28px; text-align:center;
      border:1.5px solid #f1f5f9; box-shadow:0 2px 12px rgba(0,0,0,.05); transition:all .25s;
    }
    .hco-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.08); }
    .hco-icon { width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:22px; margin:0 auto 14px; }
    .hco-lbl { font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; margin-bottom:6px; }
    .hco-val { font-size:15px; font-weight:700; color:#0f172a; }

    /* ═══════ FOOTER ═══════ */
    .hf { background:#0f172a; padding:52px 24px 0; }
    .hf-inner { max-width:1200px; margin:0 auto; display:flex; gap:60px; flex-wrap:wrap; padding-bottom:40px; border-bottom:1px solid rgba(255,255,255,.08); }
    .hf-brand { flex:1; min-width:200px; }
    .hf-chip { margin-bottom:14px; padding:8px 14px; }
    .hf-chip .brand-logo { height:40px; }
    .hf-tag  { font-size:13px; color:#475569; line-height:1.7; max-width:220px; }
    .hf-cols { display:flex; gap:60px; flex-wrap:wrap; }
    .hf-col  { display:flex; flex-direction:column; gap:10px; }
    .hf-col-h{ font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#475569; margin-bottom:4px; }
    .hf-col a{ font-size:14px; color:#475569; transition:color .2s; }
    .hf-col a:hover { color:#fff; }
    .hf-bottom { max-width:1200px; margin:0 auto; padding:18px 0; text-align:center; font-size:13px; color:#334155; }

    /* ═══════ RESPONSIVE ═══════ */
    @media(min-width:960px) { .hh-right { display:block; } }
    @media(max-width:960px) { .hh-right { display:none; } }
    @media(max-width:768px) { .hn-links,.hn-cta { display:none; } .hn-burger { display:block; } .hf-cols { gap:32px; } }
  `]
})
export class HomeComponent implements OnInit, AfterViewInit {
  scrolled = false;
  menu = false;
  medecins: any[] = [];
  stats: any = {};

  services = [
    { icon:'fa-heart-pulse',   title:'Cardiologie',      desc:'ECG, écho-cardiographie et bilan cardiovasculaire complet.',      bg:'#fff1f2', color:'#e11d48' },
    { icon:'fa-brain',         title:'Neurologie',       desc:'Diagnostic et traitement des maladies du système nerveux.',       bg:'#faf5ff', color:'#9333ea' },
    { icon:'fa-bone',          title:'Orthopédie',       desc:'Pathologies musculo-squelettiques et chirurgie orthopédique.',    bg:'#fffbeb', color:'#d97706' },
    { icon:'fa-eye',           title:'Ophtalmologie',    desc:'Bilan visuel complet et traitement des maladies oculaires.',     bg:'#eff6ff', color:'#1e40af' },
    { icon:'fa-stethoscope',   title:'Médecine Gén.',    desc:'Consultations généralistes et bilans de santé complets.',       bg:'#f0fdfa', color:'#0f766e' },
    { icon:'fa-baby',          title:'Pédiatrie',         desc:'Suivi de croissance, vaccinations et accompagnement parental.', bg:'#fdf2f8', color:'#db2777' },
  ];

  chiffres = [
    { icon:'fa-users',         val:'500+',  lbl:'Patients traités' },
    { icon:'fa-user-doctor',   val:'20+',   lbl:'Médecins spécialistes' },
    { icon:'fa-flask',         val:'15+',   lbl:'Spécialités médicales' },
    { icon:'fa-star',          val:'98%',   lbl:'Taux de satisfaction' },
    { icon:'fa-calendar-check',val:'1000+', lbl:'RDV par mois' },
  ];

  steps = [
    { icon:'fa-user-plus', title:'Créer un compte', desc:'Inscrivez-vous gratuitement en 2 minutes avec vos informations personnelles.', bg:'#1d4ed8', color:'#fff' },
    { icon:'fa-user-doctor', title:'Choisir un médecin', desc:'Parcourez notre équipe de spécialistes et sélectionnez celui qui vous convient.', bg:'#0d9488', color:'#fff' },
    { icon:'fa-calendar-check', title:'Prendre RDV', desc:'Choisissez un créneau disponible et confirmez votre rendez-vous en ligne.', bg:'#7c3aed', color:'#fff' },
    { icon:'fa-stethoscope', title:'Consultation', desc:'Consultez votre médecin et recevez votre ordonnance ou résultats directement.', bg:'#f59e0b', color:'#fff' },
  ];

  pourquoi = [
    'Équipe médicale diplômée et expérimentée',
    'Équipements de dernière génération',
    'Prise en charge rapide sans longue attente',
    'Suivi personnalisé de chaque patient',
    'Dossier médical numérique sécurisé',
    'Résultats d\'examens en ligne',
  ];

  hpStats = [
    { val:'500+', lbl:'Patients', color:'#1d4ed8' },
    { val:'20+',  lbl:'Médecins', color:'#0d9488' },
    { val:'98%',  lbl:'Satisfaction', color:'#7c3aed' },
    { val:'15+',  lbl:'Spécialités', color:'#f59e0b' },
  ];

  temoignages = [
    { name:'Sophie M.', role:'Patiente depuis 3 ans', text:'Une équipe médicale exceptionnelle. Prise en charge rapide et professionnelle. Je recommande vivement !' },
    { name:'Ahmed K.', role:'Patient depuis 2 ans', text:'Le portail en ligne est très pratique. Les médecins sont à l\'écoute et prennent le temps d\'expliquer.' },
    { name:'Marie L.', role:'Patiente depuis 1 an', text:'Cadre agréable, personnel accueillant et médecins compétents. Le meilleur suivi médical que j\'ai eu.' },
  ];

  contacts = [
    { icon:'fa-location-dot', label:'Adresse',   value:'12 Avenue Habib Bourguiba, Tunis',  bg:'#eff6ff', color:'#1e40af' },
    { icon:'fa-phone',        label:'Téléphone', value:'+216 71 000 000',                    bg:'#f0fdfa', color:'#0f766e' },
    { icon:'fa-envelope',     label:'Email',     value:'contact@medicare.tn',                bg:'#fffbeb', color:'#d97706' },
    { icon:'fa-clock',        label:'Horaires',  value:'Lun–Sam : 8h – 20h',                bg:'#faf5ff', color:'#9333ea' },
  ];

  constructor(private api: ApiService, private el: ElementRef) {}

  ngOnInit(): void {
    this.api.medecins().subscribe(m => this.medecins = m);
    this.api.stats().subscribe(s => this.stats = s);
  }

  ngAfterViewInit(): void {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    setTimeout(() => this.el.nativeElement.querySelectorAll('.rv').forEach((el: Element) => obs.observe(el)), 200);
  }

  specColor(spec: string): string {
    const m: Record<string,string> = {
      'Cardiologie':'linear-gradient(135deg,#e11d48,#f97316)',
      'Neurologie':'linear-gradient(135deg,#9333ea,#7c3aed)',
      'Orthopédie':'linear-gradient(135deg,#d97706,#f59e0b)',
      'Ophtalmologie':'linear-gradient(135deg,#0284c7,#1e40af)',
      'Pédiatrie':'linear-gradient(135deg,#db2777,#ec4899)',
      'chirurgien':'linear-gradient(135deg,#1e40af,#0f766e)',
      'Médecine Générale':'linear-gradient(135deg,#0f766e,#22c55e)',
    };
    return m[spec] ?? 'linear-gradient(135deg,#1e40af,#0f766e)';
  }

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled = window.scrollY > 40; }
}
