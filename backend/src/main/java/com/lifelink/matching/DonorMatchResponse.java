package com.lifelink.matching;

import com.lifelink.donor.BloodGroup;
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
    private Long donorId;
    private String donorName;
    private String donorPhone;
    private BloodGroup bloodGroup;
    private Double distanceKm;
    private Double score;
    private MatchStatus status;
    private Instant notifiedAt;

    public static DonorMatchResponse fromEntity(DonorMatch match) {
        return DonorMatchResponse.builder()
                .matchId(match.getId())
                .requestId(match.getRequest().getId())
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
