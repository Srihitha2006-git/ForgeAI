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
public class OpenAiLlmClient implements LlmClient {

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final int timeoutSeconds;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public OpenAiLlmClient(
            @Value("${ai.openai.api-key:}") String apiKey,
            @Value("${ai.openai.model:gpt-4o-mini}") String model,
            @Value("${ai.openai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${ai.chat.timeout-seconds:15}") int timeoutSeconds,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = (model != null && !model.trim().isEmpty()) ? model.trim() : "gpt-4o-mini";
        this.baseUrl = (baseUrl != null && !baseUrl.trim().isEmpty()) ? baseUrl.trim().replaceAll("/+$", "") : "https://api.openai.com/v1";
        this.timeoutSeconds = timeoutSeconds > 0 ? timeoutSeconds : 15;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(this.timeoutSeconds))
                .build();
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isEmpty();
    }

    @Override
    public String getProviderName() {
        return "openai";
    }

    @Override
    public String generateResponse(String systemPrompt, List<ChatMessageDto> messages) {
        if (!isConfigured()) {
            throw new AiConfigurationException("OpenAI API key is not configured. Set the OPENAI_API_KEY environment variable.");
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", model);
            payload.put("temperature", 0.7);
            payload.put("max_tokens", 800);

            List<Map<String, String>> chatMessages = new ArrayList<>();

            if (systemPrompt != null && !systemPrompt.trim().isEmpty()) {
                Map<String, String> sysMsg = new HashMap<>();
                sysMsg.put("role", "system");
                sysMsg.put("content", systemPrompt);
                chatMessages.add(sysMsg);
            }

            for (ChatMessageDto msg : messages) {
                if (msg == null || msg.getContent() == null || msg.getContent().trim().isEmpty()) {
                    continue;
                }
                String role = "user";
                if ("assistant".equalsIgnoreCase(msg.getRole()) || "model".equalsIgnoreCase(msg.getRole())) {
                    role = "assistant";
                }
                Map<String, String> m = new HashMap<>();
                m.put("role", role);
                m.put("content", msg.getContent());
                chatMessages.add(m);
            }

            payload.put("messages", chatMessages);

            String requestBody = objectMapper.writeValueAsString(payload);
            String endpoint = baseUrl + "/chat/completions";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    JsonNode contentNode = choices.get(0).path("message").path("content");
                    if (!contentNode.isMissingNode()) {
                        return contentNode.asText().trim();
                    }
                }
                throw new AiUpstreamException("OpenAI returned empty or unexpected response format.");
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
                throw new AiUpstreamException("OpenAI API error (" + errorDetail + ")");
            }
        } catch (HttpTimeoutException e) {
            throw new AiTimeoutException("OpenAI API request timed out after " + timeoutSeconds + " seconds.", e);
        } catch (AiConfigurationException | AiTimeoutException | AiUpstreamException e) {
            throw e;
        } catch (Exception e) {
            throw new AiUpstreamException("Failed to communicate with OpenAI API: " + e.getMessage(), e);
        }
    }
}
