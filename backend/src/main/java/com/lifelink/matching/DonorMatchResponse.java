package com.lifelink.matching;

import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.ComponentType;
import com.lifelink.request.BloodRequest;
import com.lifelink.request.Urgency;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonorMatchResponse {

    private Long matchId;
    private Long requestId;
    private String hospitalName;
    private String hospitalAddress;
    private String hospitalPhone;
    private ComponentType componentType;
    private Urgency urgency;
    private Integer unitsRequired;
    private Integer unitsFulfilled;
    private String requestStatus;
    private Long donorId;
    private String donorName;
    private String donorPhone;
    private BloodGroup bloodGroup;
    private Double distanceKm;
    private Double score;
    private MatchStatus status;
    private Instant notifiedAt;

    public static DonorMatchResponse fromEntity(DonorMatch match) {
        BloodRequest req = match.getRequest();
        return DonorMatchResponse.builder()
                .matchId(match.getId())
                .requestId(req != null ? req.getId() : null)
                .hospitalName(req != null && req.getHospital() != null ? req.getHospital().getHospitalName() : "Emergency Hospital")
                .hospitalAddress(req != null && req.getHospital() != null ? req.getHospital().getAddress() : "")
                .hospitalPhone(req != null && req.getHospital() != null ? req.getHospital().getEmergencyPhone() : "")
                .componentType(req != null ? req.getComponentType() : null)
                .urgency(req != null ? req.getUrgency() : null)
                .unitsRequired(req != null ? req.getUnitsRequired() : null)
                .unitsFulfilled(req != null ? req.getUnitsFulfilled() : null)
                .requestStatus(req != null && req.getStatus() != null ? req.getStatus().name() : null)
                .donorId(match.getDonor().getId())
                .donorName(match.getDonor().getUser().getName())
                .donorPhone(match.getDonor().getUser().getPhone())
                .bloodGroup(match.getDonor().getBloodGroup())
                .distanceKm(match.getDistance())
                .score(match.getScore())
                .status(match.getStatus())
                .notifiedAt(match.getNotifiedAt())
                .build();
    }
}
