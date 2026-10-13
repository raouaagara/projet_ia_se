package com.clinique.gestion.config;

import java.math.BigDecimal;
import java.util.Locale;

/** Devise de la clinique (dinar tunisien), utilisée dans les messages générés par le serveur. */
public final class Devise {

    public static final String SYMBOLE = "DT";

    private Devise() {
    }

    /** Ex. 1234.5 → « 1 234,500 DT ». */
    public static String formater(BigDecimal montant) {
        return String.format(Locale.FRANCE, "%,.3f", montant == null ? BigDecimal.ZERO : montant) + " " + SYMBOLE;
    }
}
