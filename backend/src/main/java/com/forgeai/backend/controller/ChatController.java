package com.forgeai.backend.controller;

import com.forgeai.backend.dto.ChatRequest;
import com.forgeai.backend.dto.ChatResponse;
import com.forgeai.backend.exception.AiConfigurationException;
import com.forgeai.backend.exception.AiTimeoutException;
import com.forgeai.backend.exception.AiUpstreamException;
import com.forgeai.backend.exception.ChatRateLimitException;
import com.forgeai.backend.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final int maxMessageLength;

    @Autowired
    public ChatController(
            ChatService chatService,
            @Value("${ai.chat.max-message-length:1000}") int maxMessageLength) {
        this.chatService = chatService;
        this.maxMessageLength = maxMessageLength > 0 ? maxMessageLength : 1000;
    }

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody(required = false) ChatRequest request, HttpServletRequest httpRequest) {
        // Validate request body is provided
        if (request == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid request body."));
        }

        // Validate message is non-empty
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Message cannot be empty."));
        }

        String userMessage = request.getMessage().trim();

        // Validate message length does not exceed maximum
        if (userMessage.length() > maxMessageLength) {
            return ResponseEntity.badRequest().body(
                    createErrorResponse("Message exceeds maximum allowed length of " + maxMessageLength + " characters.")
            );
        }

        // Determine client key for rate limiting
        String clientIp = resolveClientIp(httpRequest);

        try {
            ChatResponse response = chatService.processChat(userMessage, request.getConversationId(), clientIp);
            return ResponseEntity.ok(response);
        } catch (AiConfigurationException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(createErrorResponse(e.getMessage()));
        } catch (ChatRateLimitException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(createErrorResponse(e.getMessage()));
        } catch (AiTimeoutException e) {
            return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT).body(createErrorResponse(e.getMessage()));
        } catch (AiUpstreamException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            // Mask internal exceptions and stack traces from the browser
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while processing your chat request."));
        }
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleUnreadableBody(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(createErrorResponse("Invalid request body."));
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> errorMap = new HashMap<>();
        errorMap.put("error", message);
        return errorMap;
    }
}
