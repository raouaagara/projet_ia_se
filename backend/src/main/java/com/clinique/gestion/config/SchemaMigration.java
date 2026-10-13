package com.clinique.gestion.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Migration de compatibilité exécutée au démarrage, avant les données de démonstration.
 * Les anciennes versions stockaient les énumérations Java dans des colonnes MySQL de type ENUM : la mise à jour
 * automatique du schéma n'y ajoute jamais de nouvelles valeurs (ex. rôle PHARMACIEN). Ces colonnes sont converties
 * en VARCHAR, ce qui rend l'ajout de valeurs transparent. Les textes longs créés en TINYTEXT (255 octets) sont
 * élargis en TEXT. Hibernate effectue en général lui-même ces conversions : cette migration sert de filet de sécurité.
 * Enfin, les notifications écrites par les anciennes versions sont remises aux conventions actuelles : sans
 * pictogrammes, montants en dinars et dates au format français.
 */
@Slf4j
@Component
@Order(0)
@RequiredArgsConstructor
public class SchemaMigration implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    private static final Pattern PICTOGRAMMES =
            Pattern.compile("[\\x{1F000}-\\x{1FAFF}\\x{2600}-\\x{27BF}\\x{2B00}-\\x{2BFF}\\x{FE0F}\\x{200D}]");
    private static final Pattern MONTANT_EURO = Pattern.compile("(\\d[\\d \\u00A0\\u202F.]*(?:,\\d+)?)\\s*€");
    private static final Pattern DATE_ISO = Pattern.compile("(?<=(?:le|du|au) )(\\d{4})-(\\d{2})-(\\d{2})\\b");

    @Override
    public void run(String... args) {
        convertirColonnes();
        nettoyerNotifications();
    }

    private void convertirColonnes() {
        List<Map<String, Object>> enums;
        List<Map<String, Object>> textesCourts;
        try {
            enums = jdbc.queryForList(
                    "SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM information_schema.COLUMNS "
                  + "WHERE TABLE_SCHEMA = DATABASE() AND DATA_TYPE = 'enum'");
            // Les textes longs (@Lob) créés en TINYTEXT étaient limités à 255 octets : ils passent en TEXT.
            textesCourts = jdbc.queryForList(
                    "SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM information_schema.COLUMNS "
                  + "WHERE TABLE_SCHEMA = DATABASE() AND DATA_TYPE = 'tinytext'");
        } catch (Exception e) {
            log.debug("Migration des colonnes ignorée : {}", e.getMessage());
            return;
        }
        enums.forEach(c -> modifier(c, "VARCHAR(40)"));
        textesCourts.forEach(c -> modifier(c, "TEXT"));
    }

    private void nettoyerNotifications() {
        int corrigees = 0;
        for (Map<String, Object> n : jdbc.queryForList("SELECT id, titre, message FROM notifications")) {
            String titre = (String) n.get("titre");
            String message = (String) n.get("message");
            String nouveauTitre = corrigerTexte(titre);
            String nouveauMessage = corrigerTexte(message);
            if (!Objects.equals(titre, nouveauTitre) || !Objects.equals(message, nouveauMessage)) {
                jdbc.update("UPDATE notifications SET titre = ?, message = ? WHERE id = ?", nouveauTitre, nouveauMessage, n.get("id"));
                corrigees++;
            }
        }
        if (corrigees > 0) {
            log.info("{} notification(s) mise(s) aux conventions actuelles (pictogrammes, devise, dates)", corrigees);
        }
    }

    /** Retire les pictogrammes et convertit « 75,00 € » en « 75,000 DT » et « le 2026-09-23 » en « le 23/09/2026 ». */
    static String corrigerTexte(String texte) {
        if (texte == null) {
            return null;
        }
        String t = PICTOGRAMMES.matcher(texte).replaceAll("");
        t = MONTANT_EURO.matcher(t).replaceAll(m -> Matcher.quoteReplacement(Devise.formater(montant(m.group(1)))));
        t = DATE_ISO.matcher(t).replaceAll("$3/$2/$1");
        return t.strip();
    }

    private static BigDecimal montant(String texte) {
        return new BigDecimal(texte.replaceAll("[ \\u00A0\\u202F.]", "").replace(',', '.'));
    }

    private void modifier(Map<String, Object> c, String type) {
        String table = (String) c.get("TABLE_NAME");
        String colonne = (String) c.get("COLUMN_NAME");
        boolean nullable = "YES".equalsIgnoreCase(String.valueOf(c.get("IS_NULLABLE")));
        jdbc.execute("ALTER TABLE `" + table + "` MODIFY `" + colonne + "` " + type + (nullable ? " NULL" : " NOT NULL"));
        log.info("Colonne {}.{} convertie en {}", table, colonne, type);
    }
}
