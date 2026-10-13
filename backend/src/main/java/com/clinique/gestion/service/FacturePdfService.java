package com.clinique.gestion.service;

import com.clinique.gestion.config.Devise;
import com.clinique.gestion.dto.FactureDto;
import com.clinique.gestion.entity.StatutPaiement;
import com.itextpdf.io.font.constants.StandardFonts;
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
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Export PDF d'une facture (iText 7). Les contrôles d'accès sont ceux de {@link FactureService#findById(Long)}. */
@Service
@RequiredArgsConstructor
public class FacturePdfService {

    public record FichierPdf(String nom, byte[] contenu) {}

    private static final DateTimeFormatter FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DeviceRgb PRIMAIRE = new DeviceRgb(15, 108, 189);
    private static final DeviceRgb GRIS = new DeviceRgb(100, 116, 139);
    private static final DeviceRgb FOND = new DeviceRgb(241, 245, 249);

    private final FactureService factureService;

    public FichierPdf generer(Long factureId) {
        FactureDto f = factureService.findById(factureId);
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        try (Document doc = new Document(new PdfDocument(new PdfWriter(sortie)), PageSize.A4)) {
            PdfFont normal = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont gras = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            doc.setFont(normal).setFontSize(10);
            doc.setMargins(48, 48, 48, 48);

            Table entete = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            entete.addCell(sansBordure(new Paragraph("MediCare").setFont(gras).setFontSize(20).setFontColor(PRIMAIRE))
                    .add(new Paragraph("Clinique médicale").setFontColor(GRIS)));
            entete.addCell(sansBordure(new Paragraph("FACTURE").setFont(gras).setFontSize(16))
                    .add(new Paragraph("N° " + f.getNumeroFacture()))
                    .add(new Paragraph("Date : " + (f.getDateFacture() != null ? f.getDateFacture().format(FR) : "—")))
                    .setTextAlignment(TextAlignment.RIGHT));
            doc.add(entete);

            Table parties = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth().setMarginTop(24);
            parties.addCell(bloc(gras, "Patient", f.getPatientNom()));
            parties.addCell(bloc(gras, "Médecin", f.getMedecinNom() != null ? f.getMedecinNom() : "—"));
            doc.add(parties);

            Table lignes = new Table(UnitValue.createPercentArray(new float[]{6, 1, 2, 2})).useAllAvailableWidth().setMarginTop(24);
            for (String titre : List.of("Désignation", "Qté", "Prix unitaire", "Total")) {
                lignes.addHeaderCell(new Cell().add(new Paragraph(titre).setFont(gras).setFontColor(ColorConstants.WHITE))
                        .setBackgroundColor(PRIMAIRE).setBorder(Border.NO_BORDER).setPadding(6)
                        .setTextAlignment(titre.equals("Désignation") ? TextAlignment.LEFT : TextAlignment.RIGHT));
            }
            if (f.getLignes().isEmpty()) {
                ligne(lignes, "Consultation médicale", 1, f.getMontantTotal(), f.getMontantTotal());
            } else {
                f.getLignes().forEach(l -> ligne(lignes, l.getDescription(), l.getQuantite(), l.getPrixUnitaire(), l.getTotal()));
            }
            doc.add(lignes);

            BigDecimal total = valeur(f.getMontantTotal());
            BigDecimal paye = valeur(f.getMontantPaye());
            Table totaux = new Table(UnitValue.createPercentArray(new float[]{3, 2})).setWidth(UnitValue.createPercentValue(45))
                    .setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.RIGHT).setMarginTop(16);
            total(totaux, normal, "Montant total", montant(total));
            total(totaux, normal, "Montant payé", montant(paye));
            total(totaux, gras, "Reste à payer", montant(total.subtract(paye).max(BigDecimal.ZERO)));
            total(totaux, normal, "Statut", statut(f.getStatut()));
            doc.add(totaux);

            if (f.getNotes() != null && !f.getNotes().isBlank()) {
                doc.add(new Paragraph("Notes").setFont(gras).setMarginTop(24));
                doc.add(new Paragraph(f.getNotes()).setFontColor(GRIS));
            }
            doc.add(new Paragraph("Montants exprimés en dinars tunisiens (DT).").setFontSize(8).setFontColor(GRIS).setMarginTop(32));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return new FichierPdf("facture-" + f.getNumeroFacture() + ".pdf", sortie.toByteArray());
    }

    private static Cell sansBordure(Paragraph p) {
        return new Cell().add(p).setBorder(Border.NO_BORDER).setPadding(0);
    }

    private static Cell bloc(PdfFont gras, String titre, String valeur) {
        return new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(FOND).setPadding(10)
                .add(new Paragraph(titre.toUpperCase()).setFontSize(8).setFontColor(GRIS))
                .add(new Paragraph(valeur).setFont(gras).setFontSize(11));
    }

    private static void ligne(Table t, String designation, Integer quantite, BigDecimal prix, BigDecimal total) {
        SolidBorder bas = new SolidBorder(new DeviceRgb(226, 232, 240), 0.5f);
        t.addCell(new Cell().add(new Paragraph(designation != null ? designation : "—")).setBorder(Border.NO_BORDER).setBorderBottom(bas).setPadding(6));
        t.addCell(new Cell().add(new Paragraph(String.valueOf(quantite != null ? quantite : 1))).setBorder(Border.NO_BORDER).setBorderBottom(bas)
                .setPadding(6).setTextAlignment(TextAlignment.RIGHT));
        t.addCell(new Cell().add(new Paragraph(montant(prix))).setBorder(Border.NO_BORDER).setBorderBottom(bas).setPadding(6).setTextAlignment(TextAlignment.RIGHT));
        t.addCell(new Cell().add(new Paragraph(montant(total))).setBorder(Border.NO_BORDER).setBorderBottom(bas).setPadding(6).setTextAlignment(TextAlignment.RIGHT));
    }

    private static void total(Table t, PdfFont police, String libelle, String valeur) {
        t.addCell(new Cell().add(new Paragraph(libelle).setFont(police)).setBorder(Border.NO_BORDER).setPadding(4));
        t.addCell(new Cell().add(new Paragraph(valeur).setFont(police)).setBorder(Border.NO_BORDER).setPadding(4).setTextAlignment(TextAlignment.RIGHT));
    }

    /** Les polices standard du PDF ne contiennent pas l'espace fine insécable du format français : espace insécable classique. */
    private static String montant(BigDecimal m) {
        return Devise.formater(m).replace('\u202F', '\u00A0');
    }

    private static BigDecimal valeur(BigDecimal m) {
        return m == null ? BigDecimal.ZERO : m;
    }

    private static String statut(StatutPaiement s) {
        if (s == null) return "—";
        return switch (s) {
            case EN_ATTENTE -> "En attente";
            case PAYE -> "Payée";
            case PARTIELLEMENT_PAYE -> "Partiellement payée";
            case REMBOURSE -> "Remboursée";
            case ANNULE -> "Annulée";
        };
    }
}
