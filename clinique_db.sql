CREATE DATABASE IF NOT EXISTS clinique_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinique_db;

DROP TABLE IF EXISTS ordonnances;
DROP TABLE IF EXISTS consultations;
DROP TABLE IF EXISTS rendez_vous;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS medecins;
DROP TABLE IF EXISTS utilisateurs;

CREATE TABLE utilisateurs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  nom VARCHAR(80) NOT NULL,
  prenom VARCHAR(80) NOT NULL,
  telephone VARCHAR(20),
  role VARCHAR(20) NOT NULL,
  actif TINYINT(1) NOT NULL DEFAULT 1,
  date_creation DATETIME NULL
);

CREATE TABLE patients (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  numero_dossier VARCHAR(30) NOT NULL UNIQUE,
  nom VARCHAR(80) NOT NULL,
  prenom VARCHAR(80) NOT NULL,
  date_naissance DATE NULL,
  sexe VARCHAR(10),
  telephone VARCHAR(20),
  adresse VARCHAR(180),
  groupe_sanguin VARCHAR(80),
  allergies VARCHAR(255),
  antecedents VARCHAR(255),
  utilisateur_id BIGINT NULL,
  CONSTRAINT fk_patient_user FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE medecins (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  matricule VARCHAR(30) NOT NULL UNIQUE,
  nom VARCHAR(80) NOT NULL,
  prenom VARCHAR(80) NOT NULL,
  specialite VARCHAR(80) NOT NULL,
  telephone VARCHAR(20),
  email VARCHAR(120),
  horaires VARCHAR(120),
  disponible TINYINT(1) NOT NULL DEFAULT 1,
  utilisateur_id BIGINT NULL,
  CONSTRAINT fk_medecin_user FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE rendez_vous (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  medecin_id BIGINT NOT NULL,
  date_heure DATETIME NOT NULL,
  motif VARCHAR(255),
  statut VARCHAR(20) NOT NULL,
  notes VARCHAR(255),
  CONSTRAINT fk_rdv_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_rdv_medecin FOREIGN KEY (medecin_id) REFERENCES medecins(id)
);

CREATE TABLE consultations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  medecin_id BIGINT NOT NULL,
  rendez_vous_id BIGINT NULL,
  date_consultation DATETIME NOT NULL,
  diagnostic VARCHAR(255),
  observations TEXT,
  traitement VARCHAR(255),
  CONSTRAINT fk_cons_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_cons_medecin FOREIGN KEY (medecin_id) REFERENCES medecins(id),
  CONSTRAINT fk_cons_rdv FOREIGN KEY (rendez_vous_id) REFERENCES rendez_vous(id)
);

CREATE TABLE ordonnances (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  consultation_id BIGINT NOT NULL,
  date_emission DATE NOT NULL,
  medicaments TEXT NOT NULL,
  posologie VARCHAR(255),
  instructions VARCHAR(255),
  CONSTRAINT fk_ord_cons FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

-- mot de passe = password (BCrypt)
INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, telephone, role, actif, date_creation) VALUES
('admin@clinique.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Claire', '0102030405', 'ADMIN', 1, NOW()),
('dr.martin@clinique.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Martin', 'Jean', '0102030406', 'MEDECIN', 1, NOW()),
('secretaire@clinique.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bernard', 'Sophie', '0102030407', 'SECRETAIRE', 1, NOW()),
('patient.dupont@clinique.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dupont', 'Lucie', '0611223344', 'PATIENT', 1, NOW());

INSERT INTO patients (numero_dossier, nom, prenom, date_naissance, sexe, telephone, adresse, groupe_sanguin, allergies, antecedents, utilisateur_id) VALUES
('PAT-1001', 'Dupont', 'Lucie', '1992-03-14', 'F', '0611223344', '12 rue de la Santé, Paris', 'A+', 'Pénicilline', 'Asthme léger', 4),
('PAT-1002', 'Morel', 'Hugo', '1985-11-02', 'M', '0699887766', '8 avenue Pasteur, Lyon', 'O-', 'Aucune', 'Hypertension', NULL),
('PAT-1003', 'Nguyen', 'Lina', '2001-07-22', 'F', '0677001122', '3 place de l Hôpital, Lille', 'B+', 'Arachides', 'Aucune', NULL);

INSERT INTO medecins (matricule, nom, prenom, specialite, telephone, email, horaires, disponible, utilisateur_id) VALUES
('MED-2001', 'Martin', 'Jean', 'Médecine générale', '0102030406', 'dr.martin@clinique.local', 'Lun-Ven 08h-18h', 1, 2),
('MED-2002', 'Leroy', 'Amira', 'Cardiologie', '0102030410', 'dr.leroy@clinique.local', 'Mar-Jeu 09h-17h', 1, NULL),
('MED-2003', 'Rossi', 'Marco', 'Pédiatrie', '0102030411', 'dr.rossi@clinique.local', 'Lun-Mer 09h-16h', 1, NULL),
('MED-2004', 'Benali', 'Sara', 'Dermatologie', '0102030412', 'dr.benali@clinique.local', 'Ven 10h-18h', 1, NULL);

INSERT INTO rendez_vous (patient_id, medecin_id, date_heure, motif, statut, notes) VALUES
(1, 1, DATE_ADD(NOW(), INTERVAL 2 DAY), 'Contrôle annuel', 'CONFIRME', 'Patient à jeun'),
(2, 2, DATE_ADD(NOW(), INTERVAL 5 DAY), 'Douleur thoracique', 'PLANIFIE', NULL),
(3, 3, DATE_ADD(NOW(), INTERVAL 1 DAY), 'Vaccination', 'PLANIFIE', NULL);

INSERT INTO consultations (patient_id, medecin_id, rendez_vous_id, date_consultation, diagnostic, observations, traitement) VALUES
(1, 1, 1, DATE_SUB(NOW(), INTERVAL 10 DAY), 'Rhume allergique', 'Examen clinique normal', 'Antihistaminique 7 jours'),
(2, 2, NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), 'Suivi HTA', 'Tension 14/9', 'Maintien du traitement actuel');

INSERT INTO ordonnances (consultation_id, date_emission, medicaments, posologie, instructions) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Cétirizine 10 mg', '1 comprimé le soir', 'Éviter les allergènes connus'),
(2, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'Amlodipine 5 mg', '1 comprimé le matin', 'Contrôle tensionnel hebdomadaire');
