import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgFor, NgIf, NgClass],
  template: `
    <div class="u-page">

      <!-- HEADER -->
      <div class="u-header">
        <div>
          <h2 class="u-title"><i class="fa fa-shield-halved"></i> Utilisateurs & Rôles</h2>
          <p class="u-subtitle">Gérez les comptes et les accès de la clinique</p>
        </div>
        <div class="u-header-actions">
          <button class="u-theme-btn" (click)="toggleDark()" [title]="dark ? 'Mode clair' : 'Mode sombre'">
            <i [class]="dark ? 'fa fa-sun' : 'fa fa-moon'"></i>
          </button>
          <button class="u-btn u-btn-primary" (click)="openCreate()">
            <i class="fa fa-plus"></i> Nouvel utilisateur
          </button>
        </div>
      </div>

      <!-- STATS CHIPS -->
      <div class="u-chips">
        <div class="u-chip" *ngFor="let r of roleStats()">
          <span class="u-chip-dot" [style.background]="roleColor(r.role)"></span>
          <span class="u-chip-label">{{ r.role }}</span>
          <span class="u-chip-count">{{ r.count }}</span>
        </div>
      </div>

      <!-- TABLE CARD -->
      <div class="u-card">
        <div class="u-search-bar">
          <i class="fa fa-magnifying-glass"></i>
          <input [(ngModel)]="search" [ngModelOptions]="{standalone:true}" placeholder="Rechercher par email, nom, rôle…">
          <span class="u-count">{{ filtered().length }} / {{ items.length }}</span>
        </div>

        <div class="u-table-wrap">
          <table class="u-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filtered()" class="u-row">
                <td>
                  <div class="u-user-cell">
                    <div class="u-avatar" [style.background]="roleColor(u.role)">
                      {{ u.prenom?.charAt(0) }}{{ u.nom?.charAt(0) }}
                    </div>
                    <div>
                      <div class="u-user-name">{{ u.prenom }} {{ u.nom }}</div>
                      <div class="u-user-tel">{{ u.telephone || '—' }}</div>
                    </div>
                  </div>
                </td>
                <td class="u-email">{{ u.email }}</td>
                <td>
                  <span class="u-role-badge" [style.background]="roleColor(u.role) + '22'" [style.color]="roleColor(u.role)">
                    <i [class]="roleIcon(u.role)"></i> {{ u.role }}
                  </span>
                </td>
                <td>
                  <span class="u-status-badge" [class.active]="u.actif" [class.inactive]="!u.actif">
                    <span class="u-status-dot"></span>
                    {{ u.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td>
                  <div class="u-actions">
                    <button class="u-btn-icon u-btn-edit" (click)="edit(u)" title="Modifier">
                      <i class="fa fa-pen"></i>
                    </button>
                    <button class="u-btn-icon u-btn-delete" (click)="remove(u.id)" title="Supprimer">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="5" class="u-empty">
                  <i class="fa fa-users-slash"></i> Aucun utilisateur trouvé
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL OVERLAY -->
      <div class="u-overlay" *ngIf="showModal" (click)="closeModal()"></div>

      <!-- MODAL -->
      <div class="u-modal" *ngIf="showModal">
        <div class="u-modal-header">
          <div class="u-modal-title">
            <div class="u-modal-icon" [style.background]="editingId ? '#f59e0b22' : '#0f6cbd22'">
              <i [class]="editingId ? 'fa fa-pen' : 'fa fa-pen'" style="color:#f59e0b" *ngIf="editingId"></i>
              <i class="fa fa-user-plus" style="color:#0f6cbd" *ngIf="!editingId"></i>
            </div>
            <div>
          <div class="u-modal-heading">{{ editingId ? "Modifier l'utilisateur" : 'Nouvel utilisateur' }}</div>
              <div class="u-modal-sub">{{ editingId ? 'Mettez à jour les informations' : 'Créer un nouveau compte' }}</div>
            </div>
          </div>
          <button class="u-modal-close" (click)="closeModal()"><i class="fa fa-xmark"></i></button>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="u-modal-body">

          <div class="u-form-row">
            <div class="u-form-group">
              <label class="u-label">Nom <span class="u-required">*</span></label>
              <input class="u-input" formControlName="nom" placeholder="Martin">
              <span class="u-error" *ngIf="form.get('nom')?.invalid && form.get('nom')?.touched">Champ requis</span>
            </div>
            <div class="u-form-group">
              <label class="u-label">Prénom <span class="u-required">*</span></label>
              <input class="u-input" formControlName="prenom" placeholder="Sophie">
              <span class="u-error" *ngIf="form.get('prenom')?.invalid && form.get('prenom')?.touched">Champ requis</span>
            </div>
          </div>

          <div class="u-form-row">
            <div class="u-form-group">
              <label class="u-label">Email <span class="u-required">*</span></label>
              <input class="u-input" formControlName="email" type="email" placeholder="s.martin@clinique.fr">
              <span class="u-error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">Email invalide</span>
            </div>
            <div class="u-form-group">
              <label class="u-label">Téléphone</label>
              <input class="u-input" formControlName="telephone" placeholder="06 00 00 00 00">
            </div>
          </div>

          <div class="u-form-row">
            <div class="u-form-group">
              <label class="u-label">
                Mot de passe
                <span class="u-hint" *ngIf="editingId">(laisser vide = inchangé)</span>
              </label>
              <div class="u-pwd-wrap">
                <input class="u-input" [type]="showPwd ? 'text' : 'password'" formControlName="motDePasse" placeholder="••••••••">
                <button type="button" class="u-pwd-toggle" (click)="showPwd = !showPwd">
                  <i [class]="showPwd ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
                </button>
              </div>
            </div>
            <div class="u-form-group">
              <label class="u-label">Rôle <span class="u-required">*</span></label>
              <select class="u-input" formControlName="role">
                <option value="ADMIN">ADMIN</option>
                <option value="MEDECIN">MEDECIN</option>
                <option value="SECRETAIRE">SECRETAIRE</option>
                <option value="PATIENT">PATIENT</option>
                <option value="LABO">LABO</option>
              </select>
            </div>
          </div>

          <div class="u-form-group u-toggle-group">
            <label class="u-label">Statut du compte</label>
            <label class="u-toggle">
              <input type="checkbox" formControlName="actif">
              <span class="u-toggle-track">
                <span class="u-toggle-thumb"></span>
              </span>
              <span class="u-toggle-label">{{ form.get('actif')?.value ? 'Actif' : 'Inactif' }}</span>
            </label>
          </div>

          <div class="u-modal-error" *ngIf="saveError">
            <i class="fa fa-triangle-exclamation"></i> {{ saveError }}
          </div>

          <div class="u-modal-footer">
            <button type="button" class="u-btn u-btn-ghost" (click)="closeModal()">Annuler</button>
            <button type="submit" class="u-btn u-btn-primary" [disabled]="loading">
              <span *ngIf="loading" class="u-spinner"></span>
              <i class="fa fa-floppy-disk" *ngIf="!loading"></i>
              {{ loading ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* ── PAGE ─────────────────────────────────────────── */
    .u-page { padding: 4px 0; }

    .u-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
    }
    .u-title { font-size: 20px; font-weight: 700; margin: 0 0 4px; color: var(--text); }
    .u-title i { color: var(--primary); margin-right: 8px; }
    .u-subtitle { font-size: 13px; color: var(--text-muted); margin: 0; }
    .u-header-actions { display: flex; gap: 10px; align-items: center; }

    /* theme toggle */
    .u-theme-btn {
      width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid var(--border);
      background: var(--surface); color: var(--text); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; transition: all .2s;
    }
    .u-theme-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

    /* ── CHIPS ─────────────────────────────────────────── */
    .u-chips { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
    .u-chip {
      display: flex; align-items: center; gap: 7px; padding: 6px 14px;
      border-radius: 999px; background: var(--surface);
      border: 1.5px solid var(--border); font-size: 12.5px;
    }
    .u-chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .u-chip-label { color: var(--text-muted); }
    .u-chip-count { font-weight: 700; color: var(--text); background: var(--bg); padding: 1px 7px; border-radius: 999px; font-size: 11px; }

    /* ── CARD ──────────────────────────────────────────── */
    .u-card {
      background: var(--surface); border-radius: 16px;
      border: 1.5px solid var(--border); overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
    }

    /* ── SEARCH ────────────────────────────────────────── */
    .u-search-bar {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; border-bottom: 1.5px solid var(--border);
    }
    .u-search-bar i { color: var(--text-muted); font-size: 14px; }
    .u-search-bar input {
      flex: 1; border: none; background: transparent; outline: none;
      font-size: 14px; color: var(--text);
    }
    .u-search-bar input::placeholder { color: var(--text-muted); }
    .u-count { font-size: 12px; color: var(--text-muted); white-space: nowrap; }

    /* ── TABLE ─────────────────────────────────────────── */
    .u-table-wrap { overflow-x: auto; }
    .u-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .u-table thead tr { border-bottom: 2px solid var(--border); }
    .u-table th {
      padding: 12px 16px; text-align: left; font-size: 11px;
      font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
      color: var(--text-muted);
    }
    .u-row { border-bottom: 1px solid var(--border); transition: background .15s; }
    .u-row:last-child { border-bottom: none; }
    .u-row:hover { background: var(--bg); }
    .u-table td { padding: 12px 16px; vertical-align: middle; }

    .u-user-cell { display: flex; align-items: center; gap: 10px; }
    .u-avatar {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; color: #fff;
    }
    .u-user-name { font-weight: 600; color: var(--text); }
    .u-user-tel { font-size: 11.5px; color: var(--text-muted); }
    .u-email { color: var(--text-muted); font-size: 13px; }

    .u-role-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 600;
    }
    .u-role-badge i { font-size: 10px; }

    .u-status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 600;
    }
    .u-status-badge.active { background: #dcfce7; color: #16a34a; }
    .u-status-badge.inactive { background: #fee2e2; color: #dc2626; }
    .u-status-dot {
      width: 6px; height: 6px; border-radius: 50%; background: currentColor;
    }

    .u-actions { display: flex; gap: 6px; }
    .u-btn-icon {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 13px; transition: all .15s;
    }
    .u-btn-edit { background: #dbeafe; color: #2563eb; }
    .u-btn-edit:hover { background: #2563eb; color: #fff; }
    .u-btn-delete { background: #fee2e2; color: #dc2626; }
    .u-btn-delete:hover { background: #dc2626; color: #fff; }

    .u-empty { text-align: center; color: var(--text-muted); padding: 40px; font-size: 14px; }
    .u-empty i { margin-right: 8px; }

    /* ── BUTTONS ───────────────────────────────────────── */
    .u-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 18px; border-radius: 10px; border: 1.5px solid transparent;
      font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .2s;
    }
    .u-btn-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
    .u-btn-primary:hover { opacity: .9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15,108,189,.3); }
    .u-btn-primary:disabled { opacity: .6; cursor: not-allowed; transform: none; }
    .u-btn-ghost { background: var(--surface); color: var(--text); border-color: var(--border); }
    .u-btn-ghost:hover { background: var(--bg); }

    /* ── MODAL ─────────────────────────────────────────── */
    .u-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      backdrop-filter: blur(3px); z-index: 100;
      animation: fadeIn .2s ease;
    }
    .u-modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: min(520px, calc(100vw - 32px));
      background: var(--surface); border-radius: 20px;
      border: 1.5px solid var(--border);
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
      z-index: 101; overflow: hidden;
      animation: slideUp .25s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)); } to { opacity: 1; transform: translate(-50%, -50%); } }

    .u-modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1.5px solid var(--border);
    }
    .u-modal-title { display: flex; align-items: center; gap: 14px; }
    .u-modal-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .u-modal-heading { font-weight: 700; font-size: 16px; color: var(--text); }
    .u-modal-sub { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }
    .u-modal-close {
      width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid var(--border);
      background: var(--bg); color: var(--text-muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 14px;
    }
    .u-modal-close:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

    .u-modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }

    /* ── FORM ──────────────────────────────────────────── */
    .u-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .u-form-group { display: flex; flex-direction: column; gap: 5px; }
    .u-label { font-size: 12.5px; font-weight: 600; color: var(--text-muted); }
    .u-required { color: #ef4444; }
    .u-hint { font-weight: 400; font-size: 11px; color: var(--text-muted); margin-left: 4px; }
    .u-input {
      padding: 9px 12px; border-radius: 10px; border: 1.5px solid var(--border);
      background: var(--bg); color: var(--text); font-size: 14px; outline: none;
      transition: border-color .2s;
    }
    .u-input:focus { border-color: var(--primary); }
    .u-error { font-size: 11.5px; color: #ef4444; margin-top: 2px; }

    .u-pwd-wrap { position: relative; }
    .u-pwd-wrap .u-input { width: 100%; box-sizing: border-box; padding-right: 38px; }
    .u-pwd-toggle {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: var(--text-muted);
      font-size: 14px; padding: 0;
    }

    /* ── TOGGLE ────────────────────────────────────────── */
    .u-toggle-group { flex-direction: row; align-items: center; gap: 14px; }
    .u-toggle { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; }
    .u-toggle input { display: none; }
    .u-toggle-track {
      width: 44px; height: 24px; border-radius: 999px; background: var(--border);
      position: relative; transition: background .2s;
    }
    .u-toggle input:checked ~ .u-toggle-track { background: #16a34a; }
    .u-toggle-thumb {
      position: absolute; top: 3px; left: 3px;
      width: 18px; height: 18px; border-radius: 50%; background: #fff;
      transition: transform .2s; box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
    .u-toggle input:checked ~ .u-toggle-track .u-toggle-thumb { transform: translateX(20px); }
    .u-toggle-label { font-size: 13px; color: var(--text); font-weight: 500; }

    .u-modal-error {
      background: #fef2f2; color: #dc2626; border: 1.5px solid #fca5a5;
      border-radius: 8px; padding: 10px 14px; font-size: 13px;
    }
    .u-modal-error i { margin-right: 6px; }

    .u-modal-footer {
      display: flex; gap: 10px; justify-content: flex-end;
      padding-top: 4px; border-top: 1.5px solid var(--border); margin-top: 4px;
    }

    .u-spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
      animation: spin .6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class UtilisateursComponent implements OnInit {
  items: any[] = [];
  editingId?: number;
  showModal = false;
  loading = false;
  saveError = '';
  search = '';
  showPwd = false;
  dark = false;

  form = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: [''],
    motDePasse: [''],
    role: ['SECRETAIRE', Validators.required],
    actif: [true]
  });

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.load();
    // sync with existing theme
    this.dark = document.documentElement.classList.contains('dark');
  }

  load(): void { this.api.utilisateurs().subscribe((d) => this.items = d); }

  filtered(): any[] {
    const q = this.search.toLowerCase();
    if (!q) return this.items;
    return this.items.filter(u =>
      u.email?.toLowerCase().includes(q) ||
      u.nom?.toLowerCase().includes(q) ||
      u.prenom?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  }

  roleStats(): { role: string; count: number }[] {
    const map = new Map<string, number>();
    this.items.forEach(u => map.set(u.role, (map.get(u.role) || 0) + 1));
    return Array.from(map.entries()).map(([role, count]) => ({ role, count }));
  }

  roleColor(role: string): string {
    const colors: Record<string, string> = {
      ADMIN: '#ef4444', MEDECIN: '#0f6cbd', SECRETAIRE: '#f59e0b',
      PATIENT: '#10b981', LABO: '#7e22ce'
    };
    return colors[role] ?? '#64748b';
  }

  roleIcon(role: string): string {
    const icons: Record<string, string> = {
      ADMIN: 'fa fa-shield-halved', MEDECIN: 'fa fa-user-doctor',
      SECRETAIRE: 'fa fa-briefcase', PATIENT: 'fa fa-user', LABO: 'fa fa-flask'
    };
    return icons[role] ?? 'fa fa-circle-user';
  }

  toggleDark(): void {
    this.dark = !this.dark;
    document.documentElement.classList.toggle('dark', this.dark);
    localStorage.setItem('theme', this.dark ? 'dark' : 'light');
  }

  openCreate(): void {
    this.editingId = undefined;
    this.saveError = '';
    this.showPwd = false;
    this.form.reset({ role: 'SECRETAIRE', actif: true });
    this.form.get('motDePasse')!.setValidators([Validators.required, Validators.minLength(4)]);
    this.form.get('motDePasse')!.updateValueAndValidity();
    this.showModal = true;
  }

  edit(u: any): void {
    this.editingId = u.id;
    this.saveError = '';
    this.showPwd = false;
    // mot de passe optionnel en mode édition
    this.form.get('motDePasse')!.clearValidators();
    this.form.get('motDePasse')!.updateValueAndValidity();
    this.form.patchValue({ ...u, motDePasse: '' });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = undefined;
    this.saveError = '';
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.saveError = '';
    const payload = this.form.getRawValue();
    // Ne pas envoyer motDePasse vide en mode édition
    if (this.editingId && !payload.motDePasse) {
      delete (payload as any).motDePasse;
    }
    this.api.saveUtilisateur(payload, this.editingId).subscribe({
      next: () => { this.loading = false; this.closeModal(); this.load(); },
      error: (err) => {
        this.loading = false;
        this.saveError = err?.error?.message || `Erreur (code ${err?.status})`;
      }
    });
  }

  remove(id: number): void {
    if (!confirm('Supprimer cet utilisateur définitivement ?')) return;
    this.api.deleteUtilisateur(id).subscribe(() => this.load());
  }
}
