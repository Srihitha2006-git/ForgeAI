package com.forgeai.backend.service.ai;

import com.forgeai.backend.dto.ChatMessageDto;
import java.util.List;

public interface LlmClient {
    String generateResponse(String systemPrompt, List<ChatMessageDto> messages);
    boolean isConfigured();
    String getProviderName();
}
