package com.forgeai.backend.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.forgeai.backend.dto.ChatMessageDto;
import com.forgeai.backend.exception.AiConfigurationException;
import com.forgeai.backend.exception.AiTimeoutException;
import com.forgeai.backend.exception.AiUpstreamException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.*;

@Component
public class GeminiLlmClient implements LlmClient {

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final int timeoutSeconds;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiLlmClient(
            @Value("${ai.gemini.api-key:}") String apiKey,
            @Value("${ai.gemini.model:gemini-2.0-flash}") String model,
            @Value("${ai.gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
            @Value("${ai.chat.timeout-seconds:15}") int timeoutSeconds,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = (model != null && !model.trim().isEmpty()) ? model.trim() : "gemini-2.0-flash";
        this.baseUrl = (baseUrl != null && !baseUrl.trim().isEmpty()) ? baseUrl.trim().replaceAll("/+$", "") : "https://generativelanguage.googleapis.com";
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 15;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(this.timeoutSeconds))
                .build();
    }

    public String getModel() {
        return model;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isEmpty();
    }

    @Override
    public String getProviderName() {
        return "gemini";
    }

    @Override
    public String generateResponse(String systemPrompt, List<ChatMessageDto> messages) {
        if (!isConfigured()) {
            throw new AiConfigurationException("Gemini API key is not configured. Set the GEMINI_API_KEY environment variable.");
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();

            // 1. System instruction
            if (systemPrompt != null && !systemPrompt.trim().isEmpty()) {
                Map<String, Object> systemPart = Collections.singletonMap("text", systemPrompt.trim());
                Map<String, Object> systemInstruction = Collections.singletonMap("parts", Collections.singletonList(systemPart));
                payload.put("systemInstruction", systemInstruction);
            }

            // 2. Chat contents with alternating user/model turns (strict Gemini requirement)
            List<Map<String, Object>> contents = new ArrayList<>();
            String lastRole = null;
            List<Map<String, Object>> currentParts = null;

            for (ChatMessageDto msg : messages) {
                if (msg == null || msg.getContent() == null || msg.getContent().trim().isEmpty()) {
                    continue;
                }
                String role = "user";
                if ("assistant".equalsIgnoreCase(msg.getRole()) || "model".equalsIgnoreCase(msg.getRole())) {
                    role = "model";
                }

                Map<String, Object> textPart = Collections.singletonMap("text", msg.getContent().trim());

                if (role.equals(lastRole) && currentParts != null) {
                    currentParts.add(textPart);
                } else {
                    Map<String, Object> turn = new LinkedHashMap<>();
                    turn.put("role", role);
                    currentParts = new ArrayList<>();
                    currentParts.add(textPart);
                    turn.put("parts", currentParts);
                    contents.add(turn);
                    lastRole = role;
                }
            }

            // Ensure first message is from "user"
            while (!contents.isEmpty() && "model".equals(contents.get(0).get("role"))) {
                contents.remove(0);
            }

            if (contents.isEmpty()) {
                throw new IllegalArgumentException("No chat messages provided for generation.");
            }

            payload.put("contents", contents);

            // 3. Generation configuration
            Map<String, Object> generationConfig = new LinkedHashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("maxOutputTokens", 800);
            payload.put("generationConfig", generationConfig);

            String requestBody = objectMapper.writeValueAsString(payload);

            // Models to attempt: primary model first, followed by resilient fallbacks if 404 occurs
            List<String> modelsToTry = new ArrayList<>();
            modelsToTry.add(this.model);
            if (!modelsToTry.contains("gemini-2.0-flash")) {
                modelsToTry.add("gemini-2.0-flash");
            }
            if (!modelsToTry.contains("gemini-2.5-flash")) {
                modelsToTry.add("gemini-2.5-flash");
            }

            HttpResponse<String> response = null;
            String lastErrorDetail = null;

            for (int i = 0; i < modelsToTry.size(); i++) {
                String candidateModel = modelsToTry.get(i);
                String endpoint = String.format("%s/v1beta/models/%s:generateContent", baseUrl, candidateModel);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", apiKey)
                        .timeout(Duration.ofSeconds(timeoutSeconds))
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode candidate = candidates.get(0);
                        JsonNode textNode = candidate.path("content").path("parts").get(0).path("text");
                        if (!textNode.isMissingNode() && !textNode.asText().trim().isEmpty()) {
                            return textNode.asText().trim();
                        }
                        JsonNode finishReason = candidate.path("finishReason");
                        if (!finishReason.isMissingNode()) {
                            throw new AiUpstreamException("Gemini generation finished with status: " + finishReason.asText());
                        }
                    }
                    throw new AiUpstreamException("Gemini returned empty or unexpected candidate format.");
                } else if (response.statusCode() == 404 && i < modelsToTry.size() - 1) {
                    // Model not found on current version; retry with next fallback candidate
                    continue;
                } else {
                    break;
                }
            }

            if (response == null) {
                throw new AiUpstreamException("No response received from Gemini API.");
            }

            if (response.statusCode() == 429) {
                throw new AiUpstreamException("Gemini API rate limit exceeded. Please wait a moment before trying again.");
            } else if (response.statusCode() == 401 || response.statusCode() == 403) {
                throw new AiUpstreamException("Gemini authentication failed (HTTP " + response.statusCode() + "). Check GEMINI_API_KEY validity.");
            } else {
                String errorDetail = "HTTP " + response.statusCode();
                try {
                    JsonNode errorRoot = objectMapper.readTree(response.body());
                    JsonNode messageNode = errorRoot.path("error").path("message");
                    if (!messageNode.isMissingNode() && !messageNode.asText().isEmpty()) {
                        errorDetail += ": " + messageNode.asText();
                    }
                } catch (Exception ignored) {
                }
                throw new AiUpstreamException("Gemini API error (" + errorDetail + ")");
            }
        } catch (HttpTimeoutException e) {
            throw new AiTimeoutException("Gemini API request timed out after " + timeoutSeconds + " seconds.", e);
        } catch (AiConfigurationException | AiTimeoutException | AiUpstreamException e) {
            throw e;
        } catch (Exception e) {
            String safeMsg = (e.getMessage() != null) ? e.getMessage().replaceAll("key=[^&\\s]+", "key=REDACTED") : "Unknown network error";
            throw new AiUpstreamException("Failed to communicate with Gemini API: " + safeMsg, e);
        }
    }
}
