package com.clinique.gestion.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;

/**
 * Client du modèle de langage (API Groq, compatible OpenAI). Seul composant autorisé à appeler l'API externe :
 * la clé reste côté serveur. Si la clé n'est pas configurée, {@link #estConfigure()} renvoie false et les services
 * basculent sur leur moteur de règles local.
 */
@Slf4j
@Component
public class ClientIA {

    @Value("${app.ai.api-url:}")
    private String apiUrl;
    @Value("${app.ai.api-key:}")
    private String apiKey;
    @Value("${app.ai.model:}")
    private String modele;
    @Value("${app.ai.timeout-ms:15000}")
    private int timeoutMs;

    private RestTemplate restTemplate;

    @PostConstruct
    void init() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(timeoutMs);
        restTemplate = new RestTemplate(factory);
        log.info("Assistant IA : {}", estConfigure() ? "modèle " + modele + " (Groq)" : "clé API absente, moteur de règles local");
    }

    public boolean estConfigure() {
        return apiUrl != null && !apiUrl.isBlank() && apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("YOUR_");
    }

    public String modele() {
        return estConfigure() ? modele : "règles locales";
    }

    /**
     * Envoie un échange système + utilisateur et renvoie le texte produit.
     * @throws IllegalStateException si l'API n'est pas configurée, ne répond pas ou renvoie une réponse vide
     */
    @SuppressWarnings("unchecked")
    public String completer(String systeme, String utilisateur, double temperature, int maxTokens) {
        if (!estConfigure()) {
            throw new IllegalStateException("API IA non configurée");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        Map<String, Object> body = Map.of(
                "model", modele,
                "messages", List.of(
                        Map.of("role", "system", "content", systeme),
                        Map.of("role", "user", "content", utilisateur)),
                "temperature", temperature,
                "max_tokens", maxTokens);
        Map<String, Object> reponse = restTemplate.postForObject(apiUrl, new HttpEntity<>(body, headers), Map.class);
        if (reponse != null && reponse.get("choices") instanceof List<?> choices && !choices.isEmpty()) {
            Map<String, Object> message = (Map<String, Object>) ((Map<String, Object>) choices.get(0)).get("message");
            String contenu = message == null ? null : (String) message.get("content");
            if (contenu != null) {
                // Certains modèles exposent leur raisonnement entre balises <think> : on ne garde que la réponse.
                contenu = contenu.replaceAll("(?s)<think>.*?</think>", "").trim();
                if (!contenu.isEmpty()) {
                    return contenu;
                }
            }
        }
        throw new IllegalStateException("Réponse vide du modèle");
    }

    /** Extrait le premier objet JSON d'une réponse (les modèles ajoutent parfois du texte autour). */
    public static String extraireJson(String texte) {
        int debut = texte.indexOf('{');
        int fin = texte.lastIndexOf('}');
        if (debut < 0 || fin <= debut) {
            throw new IllegalStateException("Aucun JSON dans la réponse du modèle");
        }
        return texte.substring(debut, fin + 1);
    }
}
