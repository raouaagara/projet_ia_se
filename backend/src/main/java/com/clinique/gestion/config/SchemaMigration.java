package com.clinique.gestion.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Migration de compatibilité exécutée au démarrage, avant les données de démonstration.
 * Les anciennes versions stockaient les énumérations Java dans des colonnes MySQL de type ENUM : la mise à jour
 * automatique du schéma n'y ajoute jamais de nouvelles valeurs (ex. rôle PHARMACIEN). Ces colonnes sont converties
 * en VARCHAR, ce qui rend l'ajout de valeurs transparent. Les textes longs créés en TINYTEXT (255 octets) sont
 * élargis en TEXT. Hibernate effectue en général lui-même ces conversions : cette migration sert de filet de sécurité.
 */
@Slf4j
@Component
@Order(0)
@RequiredArgsConstructor
public class SchemaMigration implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        List<Map<String, Object>> colonnes;
        try {
            colonnes = jdbc.queryForList(
                    "SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM information_schema.COLUMNS "
                  + "WHERE TABLE_SCHEMA = DATABASE() AND DATA_TYPE = 'enum'");
        } catch (Exception e) {
            log.debug("Migration des colonnes ENUM ignorée : {}", e.getMessage());
            return;
        }
        for (Map<String, Object> c : colonnes) {
            modifier(c, "VARCHAR(40)");
        }
        // Les textes longs (@Lob) créés en TINYTEXT étaient limités à 255 octets : ils passent en TEXT.
        for (Map<String, Object> c : jdbc.queryForList(
                "SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM information_schema.COLUMNS "
              + "WHERE TABLE_SCHEMA = DATABASE() AND DATA_TYPE = 'tinytext'")) {
            modifier(c, "TEXT");
        }
    }

    private void modifier(Map<String, Object> c, String type) {
        String table = (String) c.get("TABLE_NAME");
        String colonne = (String) c.get("COLUMN_NAME");
        boolean nullable = "YES".equalsIgnoreCase(String.valueOf(c.get("IS_NULLABLE")));
        jdbc.execute("ALTER TABLE `" + table + "` MODIFY `" + colonne + "` " + type + (nullable ? " NULL" : " NOT NULL"));
        log.info("Colonne {}.{} convertie en {}", table, colonne, type);
    }
}
