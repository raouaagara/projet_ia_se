package com.clinique.gestion.config;

/**
 * WebSocket security is handled by the main SecurityConfig.
 * All WebSocket connections are permitted (JWT validated via HTTP filter).
 * This class is intentionally left empty for Spring Security 6 compatibility.
 */
public class WebSocketSecurityConfig {
    // No configuration needed — WebSocket endpoints are permitted in SecurityConfig
}
