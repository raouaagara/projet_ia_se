package com.clinique.gestion.service;

import com.clinique.gestion.entity.*;
import com.clinique.gestion.repository.*;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.clinique.gestion.security.UtilisateurCourant;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PdfExportService {

    private final OrdonnanceRepository    ordonnanceRepository;
    private final ExamenLaboratoireRepository examenRepository;
    private final UtilisateurCourant utilisateurCourant;

    // Couleurs MediCare
    private static final DeviceRgb PRIMARY   = new DeviceRgb(15, 108, 189);
    private static final DeviceRgb SECONDARY = new DeviceRgb(0, 179, 137);
    private static final DeviceRgb LIGHT_BG  = new DeviceRgb(240, 249, 255);
    private static final DeviceRgb DARK_TEXT = new DeviceRgb(15, 23, 42);
    private static final DeviceRgb MUTED     = new DeviceRgb(100, 116, 139);

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ── ORDONNANCE ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] exporterOrdonnance(Long ordonnanceId) throws IOException {
        Ordonnance ord = ordonnanceRepository.findById(ordonnanceId)
            .orElseThrow(() -> new IllegalArgumentException("Ordonnance introuvable"));
        utilisateurCourant.verifierAccesPatient(ord.getConsultation().getPatient().getId());

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer   = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document doc       = new Document(pdfDoc, PageSize.A4);
        doc.setMargins(40, 50, 40, 50);

        PdfFont bold   = PdfFontFactory.createFont("Helvetica-Bold");
        PdfFont normal = PdfFontFactory.createFont("Helvetica");

        // ── En-tête
        ajouterEnTete(doc, bold, normal, "ORDONNANCE MÉDICALE",
            "N° " + ord.getId() + " — " + ord.getDateEmission().format(DATE_FMT));

        // ── Infos patient + médecin
        Consultation consult = ord.getConsultation();
        if (consult != null) {
            Patient patient = consult.getPatient();
            Medecin medecin = consult.getMedecin();
            ajouterInfosDoubles(doc, bold, normal,
                "Patient", patient != null ? patient.getPrenom() + " " + patient.getNom() : "-",
                "Médecin", medecin != null ? "Dr " + medecin.getPrenom() + " " + medecin.getNom() + " (" + medecin.getSpecialite() + ")" : "-"
            );
        }

        doc.add(new Paragraph("\n"));

        // ── Section médicaments
        ajouterSectionTitre(doc, bold, "Médicaments prescrits");
        ajouterBlocContenu(doc, normal, ord.getMedicaments());

        if (ord.getPosologie() != null && !ord.getPosologie().isBlank()) {
            doc.add(new Paragraph("\n"));
            ajouterSectionTitre(doc, bold, "Posologie");
            ajouterBlocContenu(doc, normal, ord.getPosologie());
        }

        if (ord.getInstructions() != null && !ord.getInstructions().isBlank()) {
            doc.add(new Paragraph("\n"));
            ajouterSectionTitre(doc, bold, "Instructions");
            ajouterBlocContenu(doc, normal, ord.getInstructions());
        }

        // ── Signature
        ajouterSignature(doc, bold, normal);
        ajouterPiedPage(doc, normal);

        doc.close();
        return baos.toByteArray();
    }

    // ── RÉSULTAT EXAMEN ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] exporterExamen(Long examenId) throws IOException {
        ExamenLaboratoire examen = examenRepository.findById(examenId)
            .orElseThrow(() -> new IllegalArgumentException("Examen introuvable"));
        utilisateurCourant.verifierAccesPatient(examen.getPatient().getId());

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer   = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document doc       = new Document(pdfDoc, PageSize.A4);
        doc.setMargins(40, 50, 40, 50);

        PdfFont bold   = PdfFontFactory.createFont("Helvetica-Bold");
        PdfFont normal = PdfFontFactory.createFont("Helvetica");

        String dateResultat = examen.getDateResultat() != null
            ? examen.getDateResultat().format(DATE_FMT) : "En attente";

        ajouterEnTete(doc, bold, normal, "RÉSULTAT D'EXAMEN LABORATOIRE",
            "Réf. #" + examen.getId() + " — " + examen.getDateDemande().format(DATE_FMT));

        // ── Type d'examen + statut
        ajouterInfosDoubles(doc, bold, normal,
            "Type d'examen", examen.getTypeExamen(),
            "Statut",        statut(examen.getStatut())
        );

        Patient patient = examen.getPatient();
        Medecin medecin = examen.getMedecin();
        ajouterInfosDoubles(doc, bold, normal,
            "Patient",  patient != null ? patient.getPrenom() + " " + patient.getNom() : "-",
            "Prescrit par", medecin != null ? "Dr " + medecin.getPrenom() + " " + medecin.getNom() + " (" + medecin.getSpecialite() + ")" : "-"
        );

        if (examen.getDescription() != null && !examen.getDescription().isBlank()) {
            doc.add(new Paragraph("\n"));
            ajouterSectionTitre(doc, bold, "Description de la demande");
            ajouterBlocContenu(doc, normal, examen.getDescription());
        }

        // ── Résultat
        doc.add(new Paragraph("\n"));
        if (examen.getResultatTexte() != null && !examen.getResultatTexte().isBlank()) {
            ajouterSectionTitre(doc, bold, "Résultats");
            ajouterBlocContenu(doc, normal, examen.getResultatTexte());
        } else {
            ajouterSectionTitre(doc, bold, "Résultats");
            ajouterBlocContenu(doc, normal, "Résultats non disponibles.");
        }

        if (examen.getNotes() != null && !examen.getNotes().isBlank()) {
            doc.add(new Paragraph("\n"));
            ajouterSectionTitre(doc, bold, "Notes du technicien");
            ajouterBlocContenu(doc, normal, examen.getNotes());
        }

        doc.add(new Paragraph("Date du résultat : " + dateResultat)
            .setFont(normal).setFontSize(9).setFontColor(MUTED)
            .setMarginTop(12));

        ajouterPiedPage(doc, normal);
        doc.close();
        return baos.toByteArray();
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    private void ajouterEnTete(Document doc, PdfFont bold, PdfFont normal,
                                String titre, String sousTitre) {
        // Bande colorée
        Table header = new Table(UnitValue.createPercentArray(new float[]{2f, 1f}))
            .useAllAvailableWidth();

        // Colonne gauche : titre
        Cell gauche = new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(PRIMARY)
            .setPadding(16);
        gauche.add(new Paragraph("MediCare").setFont(bold).setFontSize(22)
            .setFontColor(ColorConstants.WHITE).setMarginBottom(2));
        gauche.add(new Paragraph("Clinique Médicale").setFont(normal).setFontSize(10)
            .setFontColor(new DeviceRgb(186, 230, 253)));
        header.addCell(gauche);

        // Colonne droite : document
        Cell droite = new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(SECONDARY)
            .setPadding(16).setTextAlignment(TextAlignment.RIGHT);
        droite.add(new Paragraph(titre).setFont(bold).setFontSize(13)
            .setFontColor(ColorConstants.WHITE).setMarginBottom(2));
        droite.add(new Paragraph(sousTitre).setFont(normal).setFontSize(9)
            .setFontColor(new DeviceRgb(204, 251, 241)));
        header.addCell(droite);

        doc.add(header);
        doc.add(new Paragraph("\n").setFontSize(6));
    }

    private void ajouterInfosDoubles(Document doc, PdfFont bold, PdfFont normal,
                                      String label1, String val1, String label2, String val2) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{1f, 1f}))
            .useAllAvailableWidth();

        table.addCell(infoCellule(bold, normal, label1, val1));
        table.addCell(infoCellule(bold, normal, label2, val2));
        doc.add(table);
    }

    private Cell infoCellule(PdfFont bold, PdfFont normal, String label, String valeur) {
        Cell cell = new Cell().setBackgroundColor(LIGHT_BG).setBorder(Border.NO_BORDER)
            .setBorderLeft(new SolidBorder(PRIMARY, 3)).setPadding(10).setMargin(4);
        cell.add(new Paragraph(label).setFont(bold).setFontSize(9).setFontColor(PRIMARY).setMarginBottom(2));
        cell.add(new Paragraph(valeur).setFont(normal).setFontSize(11).setFontColor(DARK_TEXT));
        return cell;
    }

    private void ajouterSectionTitre(Document doc, PdfFont bold, String titre) {
        doc.add(new Paragraph(titre)
            .setFont(bold).setFontSize(11).setFontColor(PRIMARY)
            .setBorderBottom(new SolidBorder(PRIMARY, 1.5f))
            .setPaddingBottom(4).setMarginBottom(6));
    }

    private void ajouterBlocContenu(Document doc, PdfFont normal, String contenu) {
        doc.add(new Paragraph(contenu != null ? contenu : "-")
            .setFont(normal).setFontSize(10.5f).setFontColor(DARK_TEXT)
            .setBackgroundColor(new DeviceRgb(248, 250, 252))
            .setBorder(new SolidBorder(new DeviceRgb(226, 232, 240), 1))
            .setPadding(12));
    }

    private void ajouterSignature(Document doc, PdfFont bold, PdfFont normal) {
        doc.add(new Paragraph("\n\n"));
        Table sig = new Table(UnitValue.createPercentArray(new float[]{1f, 1f})).useAllAvailableWidth();
        Cell c1 = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT).setPaddingRight(20);
        c1.add(new Paragraph("Signature du médecin").setFont(bold).setFontSize(9).setFontColor(MUTED));
        c1.add(new Paragraph("\n\n_______________________").setFont(normal).setFontSize(9));
        sig.addCell(new Cell().setBorder(Border.NO_BORDER));
        sig.addCell(c1);
        doc.add(sig);
    }

    private void ajouterPiedPage(Document doc, PdfFont normal) {
        doc.add(new Paragraph("\n"));
        doc.add(new Paragraph("Clinique MediCare — Document généré automatiquement")
            .setFont(normal).setFontSize(8).setFontColor(MUTED)
            .setTextAlignment(TextAlignment.CENTER)
            .setBorderTop(new SolidBorder(new DeviceRgb(226, 232, 240), 1))
            .setPaddingTop(8));
    }

    private Cell cellule(PdfFont font, String texte, DeviceRgb bg, float fontSize) {
        return new Cell()
            .add(new Paragraph(texte != null ? texte : "-").setFont(font).setFontSize(fontSize))
            .setBackgroundColor(bg).setBorder(Border.NO_BORDER)
            .setBorderBottom(new SolidBorder(new DeviceRgb(241, 245, 249), 0.5f))
            .setPadding(7);
    }

    private static String statut(StatutExamen statut) {
        return switch (statut) {
            case DEMANDE -> "Demandé";
            case EN_COURS -> "En cours";
            case RESULTAT_DISPONIBLE -> "Résultat disponible";
            case ANNULE -> "Annulé";
        };
    }
}
