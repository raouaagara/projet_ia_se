import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-laboratoire',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgFor, NgIf, DatePipe],
  template: `
    <div class="lab-page">

      <!-- ══ HEADER ══════════════════════════════════════════════════════ -->
      <div class="lab-header">
        <div class="lab-header-left">
          <div class="lab-header-icon"><i class="fa fa-flask"></i></div>
          <div>
            <h2 class="lab-title">Espace Laboratoire</h2>
            <p class="lab-sub">Gestion des analyses et saisie des résultats</p>
          </div>
        </div>
        <div class="lab-header-actions">
          <div class="lab-search-wrap">
            <i class="fa fa-search"></i>
            <input class="lab-search" [(ngModel)]="searchTerm"
                   [ngModelOptions]="{standalone: true}"
                   placeholder="Rechercher un patient, un examen…">
          </div>
          <button class="btn-primary" (click)="showNew = !showNew" *ngIf="canCreate()">
            <i [class]="showNew ? 'fa fa-xmark' : 'fa fa-plus'"></i>
            {{ showNew ? 'Annuler' : 'Nouvelle demande' }}
          </button>
        </div>
      </div>

      <!-- ══ KPIs ════════════════════════════════════════════════════════ -->
      <div class="lab-kpis">
        <div class="lab-kpi" *ngFor="let k of kpis">
          <div class="lab-kpi-icon" [style.background]="k.bg" [style.color]="k.color">
            <i [class]="'fa '+k.icon"></i>
          </div>
          <div>
            <div class="lab-kpi-v">{{ k.val }}</div>
            <div class="lab-kpi-l">{{ k.label }}</div>
          </div>
        </div>
      </div>

      <!-- ══ FORMULAIRE NOUVELLE DEMANDE ════════════════════════════════ -->
      <div class="lab-card" *ngIf="showNew && canCreate()">
        <div class="lab-card-head">
          <span><i class="fa fa-file-medical"></i> Nouvelle demande d'analyse</span>
          <button class="btn-icon-ghost" (click)="showNew=false"><i class="fa fa-xmark"></i></button>
        </div>
        <form [formGroup]="newForm" (ngSubmit)="createDemande()" class="lab-form">
          <div class="lab-form-grid">
            <div class="lab-field">
              <label>Patient <span class="req">*</span></label>
              <select formControlName="patientId">
                <option value="">— Sélectionner —</option>
                <option *ngFor="let p of patients" [value]="p.id">
                  {{ p.prenom }} {{ p.nom }} — {{ p.numeroDossier }}
                </option>
              </select>
            </div>
            <div class="lab-field">
              <label>Type d'examen <span class="req">*</span></label>
              <select formControlName="typeExamen">
                <option value="">— Sélectionner —</option>
                <optgroup label="Hématologie">
                  <option>Numération Formule Sanguine (NFS)</option>
                  <option>Groupe sanguin / Rhésus</option>
                  <option>Bilan d'hémostase (TP, TCA)</option>
                  <option>Vitesse de sédimentation (VS)</option>
                </optgroup>
                <optgroup label="Biochimie">
                  <option>Glycémie à jeun</option>
                  <option>HbA1c (diabète)</option>
                  <option>Bilan lipidique (cholestérol, triglycérides)</option>
                  <option>Créatinine / Urée (fonction rénale)</option>
                  <option>Transaminases ASAT / ALAT (foie)</option>
                  <option>Ionogramme sanguin</option>
                  <option>Protéines totales / Albumine</option>
                  <option>CRP (protéine C-réactive)</option>
                  <option>Ferritine / Fer sérique</option>
                  <option>Vitamine D / Vitamine B12 / Folates</option>
                  <option>TSH / T3 / T4 (thyroïde)</option>
                  <option>PSA (prostate)</option>
                  <option>Béta-HCG (grossesse)</option>
                  <option>Acide urique</option>
                </optgroup>
                <optgroup label="Microbiologie / Immunologie">
                  <option>Analyse d'urine (ECBU)</option>
                  <option>Sérologie VIH</option>
                  <option>Sérologie Hépatite B / C</option>
                  <option>Sérologie rubéole / toxoplasmose</option>
                  <option>Prélèvement bactériologique</option>
                  <option>Test PCR viral</option>
                </optgroup>
                <optgroup label="Imagerie">
                  <option>Radiographie thoracique</option>
                  <option>Radiographie osseuse</option>
                  <option>Échographie abdominale</option>
                  <option>Échographie pelvienne</option>
                  <option>Mammographie</option>
                  <option>Scanner (CT-scan)</option>
                  <option>IRM cérébrale</option>
                  <option>IRM lombaire</option>
                </optgroup>
                <optgroup label="Cardiologie / Pneumologie">
                  <option>Électrocardiogramme (ECG)</option>
                  <option>Holter ECG 24h</option>
                  <option>Épreuve d'effort</option>
                  <option>Spirométrie (EFR)</option>
                </optgroup>
                <option>Autre</option>
              </select>
            </div>
            <div class="lab-field">
              <label>Date demande</label>
              <input type="date" formControlName="dateDemande">
            </div>
            <div class="lab-field">
              <label>Médecin prescripteur <span class="req">*</span></label>
              <!-- MÉDECIN connecté : champ verrouillé sur lui-même -->
              <div *ngIf="isMedecin()" class="lab-medecin-locked">
                <div class="lab-person-av medecin-av" style="width:32px;height:32px;border-radius:8px;font-size:12px;font-weight:800;color:#fff;background:linear-gradient(135deg,#0f6cbd,#4338ca);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  {{ medecinInitiale }}
                </div>
                <span class="lab-medecin-locked-name">{{ medecinNomConnecte }}</span>
                <span class="lab-locked-badge"><i class="fa fa-lock"></i> Automatique</span>
              </div>
              <!-- ADMIN / SECRÉTAIRE : liste déroulante -->
              <select *ngIf="!isMedecin()" formControlName="medecinId">
                <option value="">— Sélectionner —</option>
                <option *ngFor="let m of medecins" [value]="m.id">
                  Dr {{ m.prenom }} {{ m.nom }} — {{ m.specialite }}
                </option>
              </select>
            </div>
          </div>
          <div class="lab-field">
            <label>Instructions / Description</label>
            <textarea formControlName="description" rows="2"
                      placeholder="Instructions spécifiques pour le laboratoire…"></textarea>
          </div>
          <div class="lab-form-actions">
            <button type="button" class="btn-ghost" (click)="showNew=false">Annuler</button>
            <button type="submit" class="btn-primary" [disabled]="newForm.invalid || loading">
              <i class="fa fa-paper-plane"></i> Envoyer la demande
            </button>
          </div>
        </form>
      </div>

      <!-- ══ ONGLETS STATUT ══════════════════════════════════════════════ -->
      <div class="lab-tabs">
        <button class="lab-tab" [class.active]="tab === 'all'"       (click)="tab='all'">
          Tous <span class="lab-badge-count">{{ items.length }}</span>
        </button>
        <button class="lab-tab" [class.active]="tab === 'DEMANDE'"   (click)="tab='DEMANDE'">
          <span class="dot dot-blue"></span> En attente
          <span class="lab-badge-count">{{ count('DEMANDE') }}</span>
        </button>
        <button class="lab-tab" [class.active]="tab === 'EN_COURS'"  (click)="tab='EN_COURS'">
          <span class="dot dot-orange"></span> En cours
          <span class="lab-badge-count">{{ count('EN_COURS') }}</span>
        </button>
        <button class="lab-tab" [class.active]="tab === 'RESULTAT_DISPONIBLE'" (click)="tab='RESULTAT_DISPONIBLE'">
          <span class="dot dot-green"></span> Résultats disponibles
          <span class="lab-badge-count green">{{ count('RESULTAT_DISPONIBLE') }}</span>
        </button>
        <button class="lab-tab" [class.active]="tab === 'ANNULE'"    (click)="tab='ANNULE'">
          <span class="dot dot-red"></span> Annulés
          <span class="lab-badge-count">{{ count('ANNULE') }}</span>
        </button>
      </div>

      <!-- ══ LISTE EXAMENS ═══════════════════════════════════════════════ -->
      <div class="lab-list">

        <!-- Skeleton -->
        <div class="lab-sk" *ngFor="let x of [1,2,3]" [style.display]="loading ? 'block' : 'none'"></div>

        <!-- Vide -->
        <div class="lab-empty" *ngIf="!loading && filtered().length === 0">
          <i class="fa fa-flask"></i>
          <p>Aucun examen dans cette catégorie</p>
        </div>

        <!-- Carte examen -->
        <div class="lab-item" *ngFor="let e of filtered()">

          <!-- Bande gauche statut -->
          <div class="lab-item-band" [class]="'band-'+e.statut.toLowerCase()">
            <i class="fa fa-flask"></i>
            <span class="lab-item-band-txt">{{ statutShort(e.statut) }}</span>
          </div>

          <!-- Corps -->
          <div class="lab-item-body">
            <div class="lab-item-row1">
              <div class="lab-item-info">
                <span class="lab-item-type">{{ e.typeExamen }}</span>
                <span class="lab-badge" [class]="'badge-'+e.statut.toLowerCase()">
                  {{ statutLabel(e.statut) }}
                </span>
              </div>
              <div class="lab-item-dates">
                <span><i class="fa fa-calendar-plus"></i> Demandé : {{ e.dateDemande | date:'dd/MM/yyyy' }}</span>
                <span *ngIf="e.dateResultat"><i class="fa fa-calendar-check"></i> Résultat : {{ e.dateResultat | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>

            <div class="lab-item-row2">
              <div class="lab-item-people">
                <div class="lab-person">
                  <div class="lab-person-av patient-av">{{ e.patientNom?.charAt(0) }}</div>
                  <div>
                    <span class="lab-person-role">Patient</span>
                    <span class="lab-person-name">{{ e.patientNom }}</span>
                  </div>
                </div>
                <div class="lab-person-sep">→</div>
                <div class="lab-person">
                  <div class="lab-person-av medecin-av">{{ e.medecinNom?.charAt(4) }}</div>
                  <div>
                    <span class="lab-person-role">Médecin prescripteur</span>
                    <span class="lab-person-name">{{ e.medecinNom }}</span>
                  </div>
                </div>
              </div>
              <div class="lab-item-desc" *ngIf="e.description">
                <i class="fa fa-circle-info"></i> {{ e.description }}
              </div>
            </div>

            <!-- Résultat affiché -->
            <div class="lab-resultat-box" *ngIf="e.resultatTexte">
              <div class="lab-resultat-head">
                <i class="fa fa-microscope"></i> Résultat
                <span class="lab-resultat-date" *ngIf="e.dateResultat">
                  — {{ e.dateResultat | date:'dd/MM/yyyy' }}
                </span>
              </div>
              <pre class="lab-resultat-text">{{ e.resultatTexte }}</pre>
              <div class="lab-fichier" *ngIf="e.fichierResultat">
                <i class="fa fa-paperclip"></i>
                <a [href]="e.fichierResultat" target="_blank">{{ e.fichierResultat }}</a>
              </div>
            </div>

            <!-- Notes -->
            <div class="lab-notes" *ngIf="e.notes">
              <i class="fa fa-note-sticky"></i> {{ e.notes }}
            </div>
          </div>

          <!-- Actions -->
          <div class="lab-item-actions">
            <!-- Saisir / Modifier résultat -->
            <button class="lab-action-btn primary" title="Saisir le résultat"
                    (click)="ouvrirSaisie(e)" *ngIf="canEdit()">
              <i class="fa fa-microscope"></i>
              <span>{{ e.resultatTexte ? 'Modifier' : 'Saisir résultat' }}</span>
            </button>
            <!-- Passer en cours -->
            <button class="lab-action-btn warning" title="Marquer en cours"
                    (click)="changerStatut(e, 'EN_COURS')"
                    *ngIf="canEdit() && e.statut === 'DEMANDE'">
              <i class="fa fa-spinner"></i>
              <span>En cours</span>
            </button>
            <!-- Annuler -->
            <button class="lab-action-btn danger" title="Annuler"
                    (click)="changerStatut(e, 'ANNULE')"
                    *ngIf="canEdit() && e.statut !== 'ANNULE' && e.statut !== 'RESULTAT_DISPONIBLE'">
              <i class="fa fa-ban"></i>
              <span>Annuler</span>
            </button>
          </div>

        </div>
      </div>

      <!-- ══ MODAL SAISIE RÉSULTAT ════════════════════════════════════════ -->
      <div class="lab-modal-overlay" *ngIf="showSaisie" (click)="closeSaisie()">
        <div class="lab-modal" (click)="$event.stopPropagation()">
          <div class="lab-modal-head">
            <div class="lab-modal-icon"><i class="fa fa-microscope"></i></div>
            <div>
              <h3 class="lab-modal-title">Saisie du résultat</h3>
              <p class="lab-modal-sub">{{ selectedExamen?.typeExamen }} — {{ selectedExamen?.patientNom }}</p>
            </div>
            <button class="btn-icon-ghost" (click)="closeSaisie()"><i class="fa fa-xmark"></i></button>
          </div>

          <form [formGroup]="saisieForm" (ngSubmit)="saveResultat()" class="lab-modal-body">

            <div class="lab-form-grid">
              <div class="lab-field">
                <label>Statut</label>
                <select formControlName="statut">
                  <option value="EN_COURS">En cours d'analyse</option>
                  <option value="RESULTAT_DISPONIBLE">✅ Résultat disponible</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>
              <div class="lab-field">
                <label>Date du résultat</label>
                <input type="date" formControlName="dateResultat">
              </div>
            </div>

            <div class="lab-field">
              <label>Résultat (texte libre)</label>
              <textarea formControlName="resultatTexte" rows="8"
                        placeholder="Saisissez les valeurs et l'interprétation…&#10;&#10;Exemple :&#10;Globules rouges : 4.8 M/µL (normal 4.5–5.5)&#10;Globules blancs : 7.2 K/µL (normal 4.0–10.0)&#10;Hémoglobine : 13.5 g/dL (normal 12–16)&#10;&#10;Conclusion : Bilan normal"></textarea>
            </div>

            <div class="lab-field">
              <label>Lien / URL du fichier résultat (optionnel)</label>
              <input type="text" formControlName="fichierResultat"
                     placeholder="https://… ou nom du fichier">
            </div>

            <div class="lab-field">
              <label>Notes internes</label>
              <input type="text" formControlName="notes"
                     placeholder="Notes pour le médecin ou l'équipe">
            </div>

            <!-- Avertissement notification -->
            <div class="lab-notif-warn" *ngIf="saisieForm.get('statut')?.value === 'RESULTAT_DISPONIBLE'">
              <i class="fa fa-bell"></i>
              <div>
                <strong>Notification automatique</strong>
                <p>En validant ce résultat, une notification sera envoyée automatiquement
                   au <strong>patient</strong> ({{ selectedExamen?.patientNom }}) ET
                   au <strong>médecin prescripteur</strong> ({{ selectedExamen?.medecinNom }}).</p>
              </div>
            </div>

            <div class="lab-modal-actions">
              <button type="button" class="btn-ghost" (click)="closeSaisie()">Annuler</button>
              <button type="submit" class="btn-primary" [disabled]="saisieForm.invalid || loading">
                <i class="fa fa-floppy-disk"></i>
                {{ loading ? 'Enregistrement…' : 'Enregistrer le résultat' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .lab-page { display:flex; flex-direction:column; gap:22px; animation:fadeUp .5s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* ── Header ─────────────────────────────────────────────────── */
    .lab-header {
      display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;
      background:linear-gradient(135deg,#7e22ce 0%,#4338ca 100%);
      border-radius:20px; padding:24px 28px; color:#fff;
      box-shadow:0 8px 28px rgba(126,34,206,.3);
    }
    .lab-header-left { display:flex; align-items:center; gap:16px; }
    .lab-header-icon {
      width:56px; height:56px; border-radius:16px; background:rgba(255,255,255,.2);
      display:flex; align-items:center; justify-content:center; font-size:24px; color:#fff;
      flex-shrink:0;
    }
    .lab-title { font-size:22px; font-weight:900; margin:0 0 5px; }
    .lab-sub   { font-size:13px; color:rgba(255,255,255,.75); margin:0; }
    .lab-header-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .lab-search-wrap {
      display:flex; align-items:center; gap:8px;
      background:rgba(255,255,255,.15); border-radius:10px; padding:8px 14px;
      border:1.5px solid rgba(255,255,255,.2);
    }
    .lab-search-wrap i { color:rgba(255,255,255,.7); font-size:13px; }
    .lab-search {
      background:none; border:none; outline:none; color:#fff;
      font-size:13.5px; width:200px; font-family:inherit;
    }
    .lab-search::placeholder { color:rgba(255,255,255,.5); }

    /* ── KPIs ───────────────────────────────────────────────────── */
    .lab-kpis { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:12px; }
    .lab-kpi {
      background:var(--surface,#fff); border-radius:14px; padding:16px;
      border:1.5px solid var(--border,#e2e8f0);
      display:flex; align-items:center; gap:12px;
      box-shadow:0 2px 8px rgba(0,0,0,.04); transition:transform .2s;
    }
    .lab-kpi:hover { transform:translateY(-3px); }
    .lab-kpi-icon { width:44px; height:44px; border-radius:12px; display:flex;
      align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
    .lab-kpi-v { font-size:24px; font-weight:900; color:var(--text,#0f172a); }
    .lab-kpi-l { font-size:12px; color:var(--text-muted,#64748b); font-weight:600; }

    /* ── Card formulaire ─────────────────────────────────────────── */
    .lab-card {
      background:var(--surface,#fff); border-radius:18px; padding:24px;
      border:1.5px solid var(--border,#e2e8f0); box-shadow:0 2px 10px rgba(0,0,0,.05);
      animation:fadeUp .3s ease;
    }
    .lab-card-head {
      display:flex; align-items:center; justify-content:space-between;
      font-size:15px; font-weight:800; color:var(--text,#0f172a); margin-bottom:18px;
    }
    .lab-card-head i { color:#7e22ce; margin-right:8px; }

    .lab-form { display:flex; flex-direction:column; gap:14px; }
    .lab-form-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; }
    .lab-field { display:flex; flex-direction:column; gap:5px; }
    .lab-field label { font-size:12.5px; font-weight:700; color:var(--text-muted,#475569); }
    .req { color:#ef4444; }
    .lab-field input, .lab-field select, .lab-field textarea {
      padding:9px 12px; border-radius:10px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--bg,#f8fafc); color:var(--text,#0f172a); font-size:13.5px;
      outline:none; transition:border-color .2s; font-family:inherit; resize:vertical;
    }
    .lab-field input:focus, .lab-field select:focus, .lab-field textarea:focus {
      border-color:#7e22ce; background:#fff; box-shadow:0 0 0 3px rgba(126,34,206,.08);
    }
    .lab-form-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:4px; }

    /* ── Onglets ────────────────────────────────────────────────── */
    .lab-tabs {
      display:flex; gap:6px; flex-wrap:wrap;
      background:var(--surface,#fff); border-radius:14px; padding:10px 12px;
      border:1.5px solid var(--border,#e2e8f0); box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .lab-tab {
      display:flex; align-items:center; gap:7px;
      padding:8px 16px; border-radius:10px; border:none;
      background:transparent; color:var(--text-muted,#64748b);
      font-size:13.5px; font-weight:600; cursor:pointer; transition:all .18s;
    }
    .lab-tab:hover  { background:var(--bg,#f0f4f8); color:var(--text,#0f172a); }
    .lab-tab.active { background:#f3e8ff; color:#7e22ce; }
    .lab-badge-count {
      min-width:20px; height:20px; border-radius:999px; padding:0 6px;
      background:var(--bg,#f0f4f8); color:var(--text-muted,#64748b);
      font-size:11px; font-weight:800; display:inline-flex; align-items:center; justify-content:center;
    }
    .lab-badge-count.green { background:#dcfce7; color:#15803d; }
    .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .dot-blue   { background:#3b82f6; }
    .dot-orange { background:#f59e0b; }
    .dot-green  { background:#22c55e; }
    .dot-red    { background:#ef4444; }

    /* ── Liste ──────────────────────────────────────────────────── */
    .lab-list { display:flex; flex-direction:column; gap:12px; }
    .lab-sk { height:110px; border-radius:16px;
      background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite; }

    .lab-empty { text-align:center; padding:50px 24px; background:var(--surface,#fff);
      border-radius:16px; border:1.5px solid var(--border,#e2e8f0); color:var(--text-muted,#94a3b8); }
    .lab-empty i { font-size:36px; display:block; margin-bottom:12px; color:#ddd6fe; }
    .lab-empty p { font-size:14px; margin:0; }

    .lab-item {
      display:flex; background:var(--surface,#fff); border-radius:18px;
      border:1.5px solid var(--border,#e2e8f0); overflow:hidden;
      box-shadow:0 2px 10px rgba(0,0,0,.05); transition:all .22s; align-items:stretch;
    }
    .lab-item:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.1); }

    /* Bande latérale statut */
    .lab-item-band {
      width:72px; display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:6px; padding:14px 8px; flex-shrink:0;
    }
    .lab-item-band i { font-size:22px; color:#fff; }
    .lab-item-band-txt {
      font-size:9px; font-weight:800; color:rgba(255,255,255,.9);
      text-transform:uppercase; letter-spacing:.05em; text-align:center; line-height:1.3;
    }
    .band-demande             { background:linear-gradient(160deg,#3b82f6,#0f6cbd); }
    .band-en_cours            { background:linear-gradient(160deg,#f59e0b,#f97316); }
    .band-resultat_disponible { background:linear-gradient(160deg,#22c55e,#00b389); }
    .band-annule              { background:linear-gradient(160deg,#94a3b8,#64748b); }

    /* Corps de la carte */
    .lab-item-body { flex:1; padding:18px 20px; display:flex; flex-direction:column; gap:10px; }

    .lab-item-row1 { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
    .lab-item-info { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .lab-item-type { font-size:15.5px; font-weight:900; color:var(--text,#0f172a); }
    .lab-item-dates { display:flex; gap:14px; flex-wrap:wrap; font-size:12px; color:var(--text-muted,#64748b); }
    .lab-item-dates span { display:flex; align-items:center; gap:5px; }

    .lab-item-row2 { display:flex; flex-direction:column; gap:8px; }
    .lab-item-people { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .lab-person { display:flex; align-items:center; gap:8px; }
    .lab-person-av {
      width:36px; height:36px; border-radius:10px; flex-shrink:0;
      font-size:13px; font-weight:800; color:#fff;
      display:flex; align-items:center; justify-content:center;
    }
    .patient-av  { background:linear-gradient(135deg,#22c55e,#00b389); }
    .medecin-av  { background:linear-gradient(135deg,#0f6cbd,#4338ca); }
    .lab-person-role { display:block; font-size:10.5px; color:var(--text-muted,#94a3b8); font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
    .lab-person-name { display:block; font-size:13.5px; font-weight:700; color:var(--text,#0f172a); }
    .lab-person-sep  { font-size:16px; color:var(--text-muted,#d1d5db); font-weight:300; }

    .lab-item-desc { font-size:12.5px; color:var(--text-muted,#64748b);
      display:flex; align-items:center; gap:6px; }

    .lab-resultat-box {
      background:linear-gradient(135deg,#f0fdf4,#f5f3ff);
      border:1.5px solid #bbf7d0; border-radius:12px; padding:14px 16px;
    }
    .lab-resultat-head {
      display:flex; align-items:center; gap:7px;
      font-size:12.5px; font-weight:800; color:#15803d; margin-bottom:8px;
    }
    .lab-resultat-date { color:#64748b; font-weight:500; }
    .lab-resultat-text {
      font-size:13px; color:var(--text,#0f172a); margin:0;
      white-space:pre-wrap; line-height:1.6; font-family:monospace;
    }
    .lab-fichier { margin-top:8px; font-size:12px; color:#0f6cbd; display:flex; align-items:center; gap:6px; }
    .lab-fichier a { color:inherit; }
    .lab-notes { font-size:12px; color:var(--text-muted,#94a3b8);
      display:flex; align-items:center; gap:6px; background:var(--bg,#f8fafc);
      border-radius:8px; padding:7px 10px; }

    /* Actions carte */
    .lab-item-actions {
      display:flex; flex-direction:column; gap:6px; padding:16px 14px;
      border-left:1.5px solid var(--border,#f1f5f9); flex-shrink:0; justify-content:center;
    }
    .lab-action-btn {
      display:flex; align-items:center; gap:6px; padding:8px 14px;
      border-radius:9px; border:none; cursor:pointer; font-size:12.5px; font-weight:700;
      transition:all .18s; white-space:nowrap;
    }
    .lab-action-btn.primary { background:#f3e8ff; color:#7e22ce; }
    .lab-action-btn.primary:hover { background:#7e22ce; color:#fff; }
    .lab-action-btn.warning { background:#fef9c3; color:#854d0e; }
    .lab-action-btn.warning:hover { background:#f59e0b; color:#fff; }
    .lab-action-btn.danger  { background:#fff5f5; color:#b91c1c; }
    .lab-action-btn.danger:hover  { background:#ef4444; color:#fff; }

    /* Badges */
    .lab-badge { padding:4px 11px; border-radius:6px; font-size:11.5px; font-weight:700; }
    .badge-demande             { background:#dbeafe; color:#1d4ed8; }
    .badge-en_cours            { background:#fff7ed; color:#c2410c; }
    .badge-resultat_disponible { background:#dcfce7; color:#15803d; }
    .badge-annule              { background:#f1f5f9; color:#64748b; }

    /* ── Modal saisie ───────────────────────────────────────────── */
    .lab-modal-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:500;
      display:flex; align-items:center; justify-content:center; padding:20px;
      animation:fadeIn .2s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .lab-modal {
      background:var(--surface,#fff); border-radius:22px; width:100%; max-width:640px;
      max-height:90vh; overflow-y:auto; box-shadow:0 24px 64px rgba(0,0,0,.25);
      animation:slideUp .25s ease;
    }
    @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    .lab-modal-head {
      display:flex; align-items:center; gap:14px; padding:22px 24px;
      background:linear-gradient(135deg,#f5f3ff,#ede9fe);
      border-bottom:1.5px solid #ddd6fe; position:sticky; top:0;
    }
    .lab-modal-icon {
      width:48px; height:48px; border-radius:14px; flex-shrink:0;
      background:linear-gradient(135deg,#7e22ce,#4338ca);
      display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px;
    }
    .lab-modal-title { font-size:18px; font-weight:900; color:var(--text,#0f172a); margin:0 0 4px; }
    .lab-modal-sub   { font-size:13px; color:var(--text-muted,#64748b); margin:0; }
    .lab-modal-body  { padding:24px; display:flex; flex-direction:column; gap:16px; }
    .lab-modal-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:8px;
      border-top:1.5px solid var(--border,#f1f5f9); }

    .lab-notif-warn {
      display:flex; align-items:flex-start; gap:12px;
      background:linear-gradient(135deg,#fffbeb,#fef3c7);
      border:1.5px solid #fde68a; border-radius:12px; padding:14px 16px;
    }
    .lab-notif-warn i { color:#f59e0b; font-size:18px; flex-shrink:0; margin-top:2px; }
    .lab-notif-warn strong { display:block; font-size:13.5px; color:#854d0e; margin-bottom:4px; }
    .lab-notif-warn p { font-size:13px; color:#92400e; margin:0; line-height:1.5; }

    /* ── Boutons ────────────────────────────────────────────────── */
    .lab-medecin-locked {
      display:flex; align-items:center; gap:10px;
      padding:10px 14px; border-radius:10px;
      border:1.5px solid #ddd6fe; background:#f5f3ff;
    }
    .lab-medecin-locked-name { font-size:13.5px; font-weight:700; color:#4338ca; flex:1; }
    .lab-locked-badge {
      display:inline-flex; align-items:center; gap:5px;
      padding:3px 10px; border-radius:6px; font-size:11px; font-weight:700;
      background:#ede9fe; color:#7e22ce;
    }
    .btn-primary {
      display:inline-flex; align-items:center; gap:7px; padding:10px 20px;
      border-radius:11px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#7e22ce,#4338ca); color:#fff;
      font-size:13.5px; font-weight:700; transition:all .2s;
      box-shadow:0 4px 12px rgba(126,34,206,.3);
    }
    .btn-primary:hover:not(:disabled) { transform:translateY(-2px); }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
    .btn-ghost {
      padding:10px 20px; border-radius:11px; border:1.5px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); color:var(--text-muted,#64748b);
      font-size:13.5px; font-weight:600; cursor:pointer; transition:all .18s;
    }
    .btn-ghost:hover { background:#f5f3ff; border-color:#ddd6fe; color:#7e22ce; }
    .btn-icon-ghost {
      background:none; border:none; cursor:pointer; color:var(--text-muted,#94a3b8);
      font-size:16px; padding:6px; border-radius:8px; transition:all .15s; margin-left:auto;
    }
    .btn-icon-ghost:hover { color:#ef4444; background:#fff5f5; }
  `]
})
export class LaboratoireComponent implements OnInit {

  items: any[] = [];
  patients: any[] = [];
  medecins: any[] = [];
  medecinId?: number;
  medecinNomConnecte = '';   // Nom affiché dans le champ verrouillé
  medecinInitiale    = '';   // Initiale pour l'avatar

  showNew    = false;
  showSaisie = false;
  selectedExamen: any = null;
  tab        = 'all';
  searchTerm = '';
  loading    = false;

  newForm = this.fb.group({
    patientId:   [null as number | null, Validators.required],
    medecinId:   [null as number | null, Validators.required],
    typeExamen:  ['', Validators.required],
    description: [''],
    dateDemande: [new Date().toISOString().split('T')[0]]
  });

  saisieForm = this.fb.group({
    statut:         ['RESULTAT_DISPONIBLE'],
    dateResultat:   [new Date().toISOString().split('T')[0]],
    resultatTexte:  ['', Validators.required],
    fichierResultat:[''],
    notes:          ['']
  });

  get kpis() {
    return [
      { val: this.items.length,                      label: 'Total',             icon: 'fa-flask',         bg: '#f3e8ff', color: '#7e22ce' },
      { val: this.count('DEMANDE'),                  label: 'En attente',        icon: 'fa-clock',         bg: '#dbeafe', color: '#1d4ed8' },
      { val: this.count('EN_COURS'),                 label: 'En cours',          icon: 'fa-spinner',       bg: '#fff7ed', color: '#c2410c' },
      { val: this.count('RESULTAT_DISPONIBLE'),      label: 'Résultats dispo.',  icon: 'fa-circle-check',  bg: '#dcfce7', color: '#15803d' }
    ];
  }

  constructor(private fb: FormBuilder, private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.api.medecins().subscribe(m => this.medecins = m);

    if (this.isMedecin()) {
      // Médecin connecté : verrouiller le prescripteur + charger uniquement ses patients
      const uid = this.auth.current()?.id;
      this.api.medecinByUser(uid!).pipe(catchError(() => of(null))).subscribe(m => {
        if (m) {
          this.medecinId = m.id;
          this.medecinNomConnecte = `Dr ${m.prenom} ${m.nom} — ${m.specialite}`;
          this.medecinInitiale    = (m.prenom?.[0] ?? '') + (m.nom?.[0] ?? '');
          // Forcer et verrouiller le champ medecinId
          this.newForm.patchValue({ medecinId: m.id });
          this.newForm.get('medecinId')?.disable();
          // Charger uniquement les patients de ce médecin
          this.api.patientsByMedecin(m.id).subscribe(p => this.patients = p);
          // Charger uniquement ses examens
          this.api.examensMedecin(m.id).subscribe(d => this.items = d);
        }
      });
    } else {
      // Admin / Secrétaire : tous les patients et tous les examens
      this.api.patients().subscribe(p => this.patients = p);
      this.api.examens().subscribe(d => this.items = d);
    }
  }

  createDemande(): void {
    if (this.newForm.invalid) return;
    this.loading = true;
    const v = this.newForm.getRawValue(); // getRawValue récupère aussi les champs disabled
    const body = {
      ...v,
      patientId:  +v.patientId!,
      medecinId:  this.medecinId ?? +v.medecinId!,  // priorité au medecinId verrouillé
      statut: 'DEMANDE'
    };
    this.api.saveExamen(body).subscribe({
      next: () => {
        this.showNew = false;
        this.newForm.reset({ dateDemande: new Date().toISOString().split('T')[0] });
        if (this.medecinId) this.newForm.patchValue({ medecinId: this.medecinId });
        this.reload();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  ouvrirSaisie(e: any): void {
    this.selectedExamen = e;
    this.showSaisie = true;
    this.saisieForm.patchValue({
      statut: e.statut === 'RESULTAT_DISPONIBLE' ? 'RESULTAT_DISPONIBLE' : 'RESULTAT_DISPONIBLE',
      dateResultat: e.dateResultat ?? new Date().toISOString().split('T')[0],
      resultatTexte: e.resultatTexte ?? '',
      fichierResultat: e.fichierResultat ?? '',
      notes: e.notes ?? ''
    });
  }

  saveResultat(): void {
    if (!this.selectedExamen || this.saisieForm.invalid) return;
    this.loading = true;
    const v = this.saisieForm.getRawValue();

    // Si statut = RESULTAT_DISPONIBLE → endpoint dédié avec notifications atomiques
    if (v.statut === 'RESULTAT_DISPONIBLE') {
      const body = {
        examenId:        this.selectedExamen.id as number,
        resultatTexte:   v.resultatTexte ?? '',
        fichierResultat: v.fichierResultat || undefined,
        notes:           v.notes || undefined,
        dateResultat:    v.dateResultat || undefined
      };
      this.api.publierResultat(body).subscribe({
        next: () => { this.closeSaisie(); this.reload(); this.loading = false; },
        error: () => this.loading = false
      });
    } else {
      // Changement de statut simple (EN_COURS, ANNULE) → PUT normal
      const body = { ...this.selectedExamen, ...v };
      this.api.saveExamen(body, this.selectedExamen.id).subscribe({
        next: () => { this.closeSaisie(); this.reload(); this.loading = false; },
        error: () => this.loading = false
      });
    }
  }

  changerStatut(e: any, statut: string): void {
    this.api.saveExamen({ ...e, statut }, e.id).subscribe(() => this.reload());
  }

  closeSaisie(): void {
    this.showSaisie = false;
    this.selectedExamen = null;
    this.saisieForm.reset();
  }

  reload(): void {
    if (this.isMedecin() && this.medecinId) {
      this.api.examensMedecin(this.medecinId).subscribe(d => this.items = d);
    } else {
      this.api.examens().subscribe(d => this.items = d);
    }
  }

  filtered(): any[] {
    let list = this.tab === 'all' ? this.items : this.items.filter(e => e.statut === this.tab);
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(e =>
        e.patientNom?.toLowerCase().includes(q) ||
        e.typeExamen?.toLowerCase().includes(q) ||
        e.medecinNom?.toLowerCase().includes(q)
      );
    }
    return list;
  }

  count(s: string): number { return this.items.filter(e => e.statut === s).length; }

  statutLabel(s: string): string {
    const m: Record<string,string> = { DEMANDE:'En attente', EN_COURS:'En cours', RESULTAT_DISPONIBLE:'Résultat dispo.', ANNULE:'Annulé' };
    return m[s] ?? s;
  }
  statutShort(s: string): string {
    const m: Record<string,string> = { DEMANDE:'Attente', EN_COURS:'En cours', RESULTAT_DISPONIBLE:'Résultat', ANNULE:'Annulé' };
    return m[s] ?? s;
  }

  canCreate(): boolean { return ['ADMIN','MEDECIN','SECRETAIRE'].includes(this.auth.role()??''); }
  canEdit():   boolean { return ['ADMIN','SECRETAIRE'].includes(this.auth.role()??'') || this.isMedecin(); }
  isMedecin(): boolean { return this.auth.role() === 'MEDECIN'; }
}
