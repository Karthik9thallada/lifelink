package com.lifelink.request.dto;

import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.ComponentType;
import com.lifelink.request.RequestStatus;
import com.lifelink.request.Urgency;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BloodRequestResponse {

    private Long id;
    private Long hospitalId;
    private String hospitalName;
    private String hospitalAddress;
    private String emergencyPhone;
    private BloodGroup bloodGroup;
    private ComponentType componentType;
    private Integer unitsRequired;
    private Integer unitsFulfilled;
    private Urgency urgency;
    private Double initialRadius;
    private Double currentRadius;
    private LocalDateTime requiredBy;
    private RequestStatus status;
    private String notes;
    private Double latitude;
    private Double longitude;
    private Instant createdAt;
}
