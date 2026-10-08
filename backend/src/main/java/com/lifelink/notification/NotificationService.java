package com.lifelink.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Dispatches a real-time notification to a specific donor's private channel.
     * Destination: /topic/donors/{donorId}
     */
    public void notifyDonor(Long donorId, String eventType, Long requestId, Object data, String message) {
        String destination = "/topic/donors/" + donorId;
        LiveUpdateMessage update = LiveUpdateMessage.builder()
                .type(eventType)
                .donorId(donorId)
                .requestId(requestId)
                .data(data)
                .message(message)
                .timestamp(Instant.now())
                .build();

        try {
            messagingTemplate.convertAndSend(destination, update);
            log.info("Dispatched WebSocket event '{}' to donor #{}: {}", eventType, donorId, message);
        } catch (Exception e) {
            log.warn("Failed to dispatch WebSocket message to {}: {}", destination, e.getMessage());
        }
    }

    /**
     * Broadcasts live updates for a specific blood request to subscribers (e.g. hospital live console).
     * Destination: /topic/requests/{requestId}
     */
    public void notifyRequestUpdate(Long requestId, String eventType, Object data, String message) {
        String destination = "/topic/requests/" + requestId;
        LiveUpdateMessage update = LiveUpdateMessage.builder()
                .type(eventType)
                .requestId(requestId)
                .data(data)
                .message(message)
                .timestamp(Instant.now())
                .build();

        try {
            messagingTemplate.convertAndSend(destination, update);
            log.info("Dispatched WebSocket event '{}' for request #{}: {}", eventType, requestId, message);
        } catch (Exception e) {
            log.warn("Failed to dispatch WebSocket message to {}: {}", destination, e.getMessage());
        }
    }

    /**
     * Broadcasts emergency blood requests to the global live feed channel.
     * Destination: /topic/requests
     */
    public void broadcastEmergencyFeed(String eventType, Object data, String message) {
        String destination = "/topic/requests";
        LiveUpdateMessage update = LiveUpdateMessage.builder()
                .type(eventType)
                .data(data)
                .message(message)
                .timestamp(Instant.now())
                .build();

        try {
            messagingTemplate.convertAndSend(destination, update);
            log.info("Broadcasted WebSocket event '{}' to global feed: {}", eventType, message);
        } catch (Exception e) {
            log.warn("Failed to dispatch WebSocket broadcast to {}: {}", destination, e.getMessage());
        }
    }
}
