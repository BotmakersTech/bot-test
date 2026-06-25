package com.botleague.backend.chat.config;

import com.botleague.backend.common.security.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;

    public WebSocketConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Existing chat endpoint — keep for backward compatibility
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns(
                        "https://test.botleague.in",
                        "http://localhost:5173",
                        "http://localhost:*");

        // Realtime endpoint — notifications, match scores, event/sport updates
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                        "https://test.botleague.in",
                        "http://localhost:5173",
                        "http://localhost:*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new WebSocketAuthInterceptor(jwtService));
    }
}
