package com.forgeai.backend.config;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class JwtUtil {
    private static final String SECRET = "ForgeAISuperSecretKeyForJWTAuthTokenGeneration2026!";
    private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

    public static String generateToken(Long userId, String email) {
        try {
            long exp = System.currentTimeMillis() + 86400000L; // 24 hours
            String payload = String.format("{\"id\":%d,\"email\":\"%s\",\"exp\":%d}", userId, email, exp);
            
            String encodedHeader = base64UrlEncode(HEADER.getBytes(StandardCharsets.UTF_8));
            String encodedPayload = base64UrlEncode(payload.getBytes(StandardCharsets.UTF_8));
            
            String signatureInput = encodedHeader + "." + encodedPayload;
            String signature = hmacSha256(signatureInput, SECRET);
            
            return signatureInput + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Error generating token", e);
        }
    }

    public static Long validateTokenAndGetUserId(String token) {
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
            String expectedSignature = hmacSha256(signatureInput, SECRET);
            if (!expectedSignature.equals(signature)) {
                return null;
            }
            
            String payloadJson = new String(base64UrlDecode(encodedPayload), StandardCharsets.UTF_8);
            
            java.util.regex.Pattern idPattern = java.util.regex.Pattern.compile("\"id\"\\s*:\\s*(\\d+)");
            java.util.regex.Pattern expPattern = java.util.regex.Pattern.compile("\"exp\"\\s*:\\s*(\\d+)");
            
            java.util.regex.Matcher idMatcher = idPattern.matcher(payloadJson);
            java.util.regex.Matcher expMatcher = expPattern.matcher(payloadJson);
            
            if (!idMatcher.find() || !expMatcher.find()) {
                return null;
            }
            
            long exp = Long.parseLong(expMatcher.group(1));
            long id = Long.parseLong(idMatcher.group(1));
            
            if (System.currentTimeMillis() > exp) {
                return null; // Expired
            }
            
            return id;
        } catch (Exception e) {
            return null;
        }
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
