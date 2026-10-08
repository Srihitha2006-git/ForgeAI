package com.forgeai.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.forgeai.backend.config.JwtUtil;
import com.forgeai.backend.dto.ChatMessageDto;
import com.forgeai.backend.dto.ChatRequest;
import com.forgeai.backend.entity.Role;
import com.forgeai.backend.entity.User;
import com.forgeai.backend.exception.AiConfigurationException;
import com.forgeai.backend.exception.AiTimeoutException;
import com.forgeai.backend.exception.AiUpstreamException;
import com.forgeai.backend.repository.UserRepository;
import com.forgeai.backend.service.ChatService;
import com.forgeai.backend.service.ai.LlmClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ChatIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ChatService chatService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.forgeai.backend.service.ai.GeminiLlmClient geminiLlmClient;

    private User testUser;
    private String customerJwt;

    @BeforeEach
    public void setup() {
        chatService.clearConversations();
        chatService.clearMockLlmClient();

        testUser = userRepository.findByEmail("testchat_user@forgeai.com").orElseGet(() -> {
            User u = new User();
            u.setName("Test Chat User");
            u.setEmail("testchat_user@forgeai.com");
            u.setPassword(passwordEncoder.encode("Password123!"));
            u.setRole(Role.CUSTOMER);
            return userRepository.save(u);
        });

        customerJwt = JwtUtil.generateToken(testUser.getId(), testUser.getEmail(), testUser.getRole().name());
    }

    @AfterEach
    public void cleanup() {
        chatService.clearConversations();
        chatService.clearMockLlmClient();
    }

    // Mock client helper
    private static class StubLlmClient implements LlmClient {
        private final String cannedReply;
        private final RuntimeException exceptionToThrow;

        public StubLlmClient(String cannedReply) {
            this.cannedReply = cannedReply;
            this.exceptionToThrow = null;
        }

        public StubLlmClient(RuntimeException exceptionToThrow) {
            this.cannedReply = null;
            this.exceptionToThrow = exceptionToThrow;
        }

        @Override
        public String generateResponse(String systemPrompt, List<ChatMessageDto> messages) {
            if (exceptionToThrow != null) {
                throw exceptionToThrow;
            }
            return cannedReply;
        }

        @Override
        public boolean isConfigured() {
            return true;
        }

        @Override
        public String getProviderName() {
            return "mock";
        }
    }

    @Test
    @DisplayName("1. Valid chatbot request returns assistant reply and conversationId")
    public void testValidChatRequest() throws Exception {
        chatService.setMockLlmClient(new StubLlmClient("Welcome to ForgeAI! You can browse cookware in our catalog."));

        ChatRequest request = new ChatRequest("Help me explore the store.", null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply", containsString("Welcome to ForgeAI")))
                .andExpect(jsonPath("$.conversationId", notNullValue()))
                .andExpect(jsonPath("$.conversationId", not(emptyOrNullString())));
    }

    @Test
    @DisplayName("1b. Conversation continuity preserves conversationId across turns")
    public void testConversationContinuity() throws Exception {
        chatService.setMockLlmClient(new StubLlmClient("You can find frying pans under cookware."));

        ChatRequest request = new ChatRequest("Where are pans?", "session-abc-123");

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply", containsString("frying pans")))
                .andExpect(jsonPath("$.conversationId", is("session-abc-123")));
    }

    @Test
    @DisplayName("2. Empty or missing message returns 400 Bad Request")
    public void testEmptyOrMissingMessage() throws Exception {
        // Empty string
        ChatRequest emptyRequest = new ChatRequest("", null);
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Message cannot be empty")));

        // Whitespace only
        ChatRequest whitespaceRequest = new ChatRequest("   ", null);
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(whitespaceRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Message cannot be empty")));

        // Null message
        ChatRequest nullMessageRequest = new ChatRequest(null, null);
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nullMessageRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Message cannot be empty")));
    }

    @Test
    @DisplayName("3. Message exceeding configured length returns 400 Bad Request")
    public void testMessageExceedingLimit() throws Exception {
        String longMessage = "A".repeat(1001);
        ChatRequest longRequest = new ChatRequest(longMessage, null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(longRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("exceeds maximum allowed length")));
    }

    @Test
    @DisplayName("4. Missing AI configuration returns 503 Service Unavailable")
    public void testMissingAiConfiguration() throws Exception {
        // Mock throwing AiConfigurationException
        chatService.setMockLlmClient(new StubLlmClient(
                new AiConfigurationException("AI service is not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY.")
        ));

        ChatRequest request = new ChatRequest("Hello", null);

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error", containsString("AI service is not configured")));
    }

    @Test
    @DisplayName("5. Upstream AI failure returns 502 Bad Gateway and timeout returns 504")
    public void testUpstreamFailureAndTimeout() throws Exception {
        // Upstream failure
        chatService.setMockLlmClient(new StubLlmClient(
                new AiUpstreamException("External provider rate limit exceeded")
        ));

        ChatRequest request = new ChatRequest("Hello", null);
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error", containsString("External provider rate limit exceeded")));

        // Timeout
        chatService.setMockLlmClient(new StubLlmClient(
                new AiTimeoutException("Upstream request timed out after 15 seconds")
        ));

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.error", containsString("timed out")));
    }

    @Test
    @DisplayName("6. Invalid request body returns 400 Bad Request")
    public void testInvalidRequestBody() throws Exception {
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid-json-content: true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid request body")));
    }

    @Test
    @DisplayName("7. Guest and authenticated users can chat; protected endpoints remain secured")
    public void testSecurityAndAuthBehavior() throws Exception {
        chatService.setMockLlmClient(new StubLlmClient("I am your ForgeAI assistant!"));

        // 1. Guest user without token can chat
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChatRequest("Hello as guest", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply", containsString("ForgeAI assistant")));

        // 2. Authenticated customer with JWT can chat
        mockMvc.perform(post("/api/chat")
                        .header("Authorization", "Bearer " + customerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChatRequest("Hello as customer", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply", containsString("ForgeAI assistant")));

        // 3. Existing customer protected endpoint still blocks unauthenticated guest
        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("8. Confirmation that existing product and cart endpoints remain unaffected")
    public void testExistingApisUnaffected() throws Exception {
        // Public product catalog is accessible
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk());

        // Authenticated cart access works
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + customerJwt))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("9. Gemini client is configured with supported model (gemini-2.0-flash)")
    public void testGeminiModelConfiguration() {
        org.assertj.core.api.Assertions.assertThat(geminiLlmClient.getModel()).isEqualTo("gemini-2.0-flash");
        org.assertj.core.api.Assertions.assertThat(geminiLlmClient.getBaseUrl()).contains("generativelanguage.googleapis.com");
    }

    @Test
    @DisplayName("10. Upstream 404 model not found maps cleanly to 502 Bad Gateway with meaningful message")
    public void testGeminiModelNotFoundMapping() throws Exception {
        chatService.setMockLlmClient(new StubLlmClient(
                new AiUpstreamException("Gemini API error (HTTP 404: models/gemini-1.5-flash is not found for API version v1beta)")
        ));

        ChatRequest request = new ChatRequest("Help me explore the store.", null);
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error", containsString("models/gemini-1.5-flash is not found")));
    }
}
