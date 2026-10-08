package com.forgeai.backend.service;

import com.forgeai.backend.dto.ChatMessageDto;
import com.forgeai.backend.dto.ChatResponse;
import com.forgeai.backend.exception.AiConfigurationException;
import com.forgeai.backend.exception.ChatRateLimitException;
import com.forgeai.backend.service.ai.GeminiLlmClient;
import com.forgeai.backend.service.ai.LlmClient;
import com.forgeai.backend.service.ai.OpenAiLlmClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatService {

    public static final String SYSTEM_PROMPT =
            "You are ForgeAI, an intelligent, helpful, and courteous shopping assistant for the ForgeAI e-commerce marketplace.\n\n" +
            "YOUR CAPABILITIES (Phase 5A):\n" +
            "- Assist shoppers with store navigation, explaining features such as browsing products, adding items to cart or wishlist, user address management, checkout, and tracking orders.\n" +
            "- Answer questions about store policies (shipping, returns, secure online payment powered by Razorpay).\n" +
            "- Provide friendly, helpful customer guidance.\n\n" +
            "IMPORTANT RESTRICTIONS:\n" +
            "- You do NOT have direct access to live inventory stock counts, specific current product prices, or real-time personal order databases in this phase.\n" +
            "- If asked about live stock, exact current prices, or specific order tracking status, politely explain that you do not have direct live database access yet, and guide the shopper to use the relevant store page:\n" +
            "  * Products & prices: Guide them to the 'Marketplace' tab or category filters.\n" +
            "  * Order status & tracking: Guide them to 'Orders' in their account menu to view the live timeline.\n" +
            "- NEVER fabricate product specifications, inventory quantities, promo codes, or false order tracking numbers.\n" +
            "- Keep your responses concise, clear, and professional.";

    private static final int MAX_HISTORY_MESSAGES = 10;
    private static final int MAX_SESSIONS = 1000;
    private static final long SESSION_EXPIRY_MS = 3600000L; // 1 hour

    private final GeminiLlmClient geminiLlmClient;
    private final OpenAiLlmClient openAiLlmClient;
    private final String configuredProvider;
    private final int rateLimitPerMinute;

    private LlmClient mockLlmClient; // Optional mock for automated tests

    // In-memory conversation storage
    private final ConcurrentHashMap<String, List<ChatMessageDto>> conversations = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lastAccessTimes = new ConcurrentHashMap<>();

    // In-memory rate limiting: client identifier -> list of request timestamps
    private final ConcurrentHashMap<String, List<Long>> rateLimitTracker = new ConcurrentHashMap<>();

    @Autowired
    public ChatService(
            GeminiLlmClient geminiLlmClient,
            OpenAiLlmClient openAiLlmClient,
            @Value("${ai.provider:}") String configuredProvider,
            @Value("${ai.chat.rate-limit-per-minute:20}") int rateLimitPerMinute) {
        this.geminiLlmClient = geminiLlmClient;
        this.openAiLlmClient = openAiLlmClient;
        this.configuredProvider = configuredProvider != null ? configuredProvider.trim().toLowerCase() : "";
        this.rateLimitPerMinute = rateLimitPerMinute > 0 ? rateLimitPerMinute : 20;
    }

    /**
     * For unit and integration tests to inject a mock LLM client.
     */
    public void setMockLlmClient(LlmClient mockLlmClient) {
        this.mockLlmClient = mockLlmClient;
    }

    public void clearMockLlmClient() {
        this.mockLlmClient = null;
    }

    /**
     * Checks rate limits for a given client (IP address or session ID).
     */
    public void checkRateLimit(String clientKey) {
        if (clientKey == null || clientKey.trim().isEmpty()) {
            return;
        }

        long now = System.currentTimeMillis();
        long windowStart = now - 60000L; // 1 minute sliding window

        rateLimitTracker.compute(clientKey, (key, timestamps) -> {
            if (timestamps == null) {
                timestamps = new ArrayList<>();
            }
            // Remove timestamps outside window
            timestamps.removeIf(t -> t < windowStart);

            if (timestamps.size() >= rateLimitPerMinute) {
                throw new ChatRateLimitException("Too many chat requests. Please wait a moment before sending another message.");
            }

            timestamps.add(now);
            return timestamps;
        });
    }

    /**
     * Resolves the active LLM client based on configuration.
     */
    public LlmClient resolveClient() {
        if (mockLlmClient != null) {
            return mockLlmClient;
        }

        if ("gemini".equalsIgnoreCase(configuredProvider)) {
            if (geminiLlmClient.isConfigured()) {
                return geminiLlmClient;
            }
            throw new AiConfigurationException("AI service is not configured. GEMINI_API_KEY is missing.");
        }

        if ("openai".equalsIgnoreCase(configuredProvider)) {
            if (openAiLlmClient.isConfigured()) {
                return openAiLlmClient;
            }
            throw new AiConfigurationException("AI service is not configured. OPENAI_API_KEY is missing.");
        }

        // Auto-detect if provider not explicitly pinned
        if (geminiLlmClient.isConfigured()) {
            return geminiLlmClient;
        }
        if (openAiLlmClient.isConfigured()) {
            return openAiLlmClient;
        }

        throw new AiConfigurationException("AI service is not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in the environment or application configuration.");
    }

    /**
     * Processes a chat message and returns the assistant's reply.
     */
    public ChatResponse processChat(String message, String conversationId, String clientKey) {
        // Enforce rate limiting
        checkRateLimit(clientKey);

        // Resolve active LLM client
        LlmClient client = resolveClient();

        // Resolve or generate conversation ID
        String activeConversationId = (conversationId != null && !conversationId.trim().isEmpty())
                ? conversationId.trim()
                : UUID.randomUUID().toString();

        cleanStaleSessionsIfNeeded();

        // Retrieve existing conversation history or initialize
        List<ChatMessageDto> history = conversations.computeIfAbsent(activeConversationId, k -> new ArrayList<>());

        synchronized (history) {
            // Append current user message
            history.add(new ChatMessageDto("user", message.trim()));

            // Limit history size to prevent context overflow
            while (history.size() > MAX_HISTORY_MESSAGES) {
                history.remove(0);
            }

            // Call the LLM provider
            String reply = client.generateResponse(SYSTEM_PROMPT, new ArrayList<>(history));

            // Append assistant reply to history
            history.add(new ChatMessageDto("assistant", reply));

            lastAccessTimes.put(activeConversationId, System.currentTimeMillis());

            return new ChatResponse(reply, activeConversationId);
        }
    }

    private void cleanStaleSessionsIfNeeded() {
        if (conversations.size() > MAX_SESSIONS) {
            long cutoff = System.currentTimeMillis() - SESSION_EXPIRY_MS;
            lastAccessTimes.forEach((id, time) -> {
                if (time < cutoff) {
                    conversations.remove(id);
                    lastAccessTimes.remove(id);
                }
            });
        }
    }

    public void clearConversations() {
        conversations.clear();
        lastAccessTimes.clear();
        rateLimitTracker.clear();
    }
}
