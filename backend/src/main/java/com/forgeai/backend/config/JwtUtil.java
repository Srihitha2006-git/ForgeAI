package com.forgeai.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Component
public class JwtUtil {
    private static final String DEFAULT_SECRET = "ForgeAISuperSecretKeyForJWTAuthTokenGeneration2026!";
    private static String secret = System.getenv("JWT_SECRET") != null && !System.getenv("JWT_SECRET").isBlank()
            ? System.getenv("JWT_SECRET")
            : DEFAULT_SECRET;
    private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

    @Value("${jwt.secret:ForgeAISuperSecretKeyForJWTAuthTokenGeneration2026!}")
    public void setConfiguredSecret(String configuredSecret) {
        if (configuredSecret != null && !configuredSecret.isBlank()) {
            secret = configuredSecret;
        }
    }

    public static class JwtClaims {
        private final Long userId;
        private final String email;
        private final String role;

        public JwtClaims(Long userId, String email, String role) {
            this.userId = userId;
            this.email = email;
            this.role = role != null ? role : "CUSTOMER";
        }

        public Long getUserId() {
            return userId;
        }

        public String getEmail() {
            return email;
        }

        public String getRole() {
            return role;
        }
    }

    public static String generateToken(Long userId, String email) {
        return generateToken(userId, email, "CUSTOMER");
    }

    public static String generateToken(Long userId, String email, String role) {
        try {
            long exp = System.currentTimeMillis() + 86400000L; // 24 hours
            String safeRole = (role != null && !role.isBlank()) ? role : "CUSTOMER";
            String payload = String.format("{\"id\":%d,\"email\":\"%s\",\"role\":\"%s\",\"exp\":%d}", userId, email, safeRole, exp);
            
            String encodedHeader = base64UrlEncode(HEADER.getBytes(StandardCharsets.UTF_8));
            String encodedPayload = base64UrlEncode(payload.getBytes(StandardCharsets.UTF_8));
            
            String signatureInput = encodedHeader + "." + encodedPayload;
            String signature = hmacSha256(signatureInput, secret);
            
            return signatureInput + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Error generating token", e);
        }
    }

    public static JwtClaims validateTokenAndGetClaims(String token) {
        if (token == null || !token.contains(".")) {
            return null;
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }
        
        String encodedHeader = parts[0];
        String encodedPayload = parts[1];
        String signature = parts[2];
        
        try {
            String signatureInput = encodedHeader + "." + encodedPayload;
            String expectedSignature = hmacSha256(signatureInput, secret);
            if (!expectedSignature.equals(signature)) {
                return null;
            }
            
            String payloadJson = new String(base64UrlDecode(encodedPayload), StandardCharsets.UTF_8);
            
            java.util.regex.Pattern idPattern = java.util.regex.Pattern.compile("\"id\"\\s*:\\s*(\\d+)");
            java.util.regex.Pattern expPattern = java.util.regex.Pattern.compile("\"exp\"\\s*:\\s*(\\d+)");
            java.util.regex.Pattern emailPattern = java.util.regex.Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"");
            java.util.regex.Pattern rolePattern = java.util.regex.Pattern.compile("\"role\"\\s*:\\s*\"([^\"]+)\"");
            
            java.util.regex.Matcher idMatcher = idPattern.matcher(payloadJson);
            java.util.regex.Matcher expMatcher = expPattern.matcher(payloadJson);
            java.util.regex.Matcher emailMatcher = emailPattern.matcher(payloadJson);
            java.util.regex.Matcher roleMatcher = rolePattern.matcher(payloadJson);
            
            if (!idMatcher.find() || !expMatcher.find()) {
                return null;
            }
            
            long exp = Long.parseLong(expMatcher.group(1));
            long id = Long.parseLong(idMatcher.group(1));
            
            if (System.currentTimeMillis() > exp) {
                return null; // Expired
            }
            
            String email = emailMatcher.find() ? emailMatcher.group(1) : null;
            String role = roleMatcher.find() ? roleMatcher.group(1) : "CUSTOMER";
            
            return new JwtClaims(id, email, role);
        } catch (Exception e) {
            return null;
        }
    }

    public static Long validateTokenAndGetUserId(String token) {
        JwtClaims claims = validateTokenAndGetClaims(token);
        return claims != null ? claims.getUserId() : null;
    }

    public static String validateTokenAndGetRole(String token) {
        JwtClaims claims = validateTokenAndGetClaims(token);
        return claims != null ? claims.getRole() : null;
    }

    private static String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static byte[] base64UrlDecode(String str) {
        return Base64.getUrlDecoder().decode(str);
    }

    private static String hmacSha256(String data, String key) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] signedBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(signedBytes);
    }
}
