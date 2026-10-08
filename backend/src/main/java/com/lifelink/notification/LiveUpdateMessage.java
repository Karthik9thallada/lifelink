package com.lifelink.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveUpdateMessage {

    private String type;         // e.g. MATCHES_FOUND, RADIUS_ESCALATED, DONOR_ACCEPTED, REQUEST_CREATED, REQUEST_CANCELLED
    private Long requestId;
    private Long donorId;
    private String message;
    private Object data;
    @Builder.Default
    private Instant timestamp = Instant.now();
}
