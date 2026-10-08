package com.lifelink.matching;

import com.lifelink.donor.Donor;
import com.lifelink.request.BloodRequest;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "donor_matches", uniqueConstraints = {
        @UniqueConstraint(name = "uk_request_donor_match", columnNames = {"request_id", "donor_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonorMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "donor_id", nullable = false)
    private Donor donor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private BloodRequest request;

    @Column(nullable = false)
    private Double distance; // Distance in kilometers

    @Column(nullable = false)
    private Double score;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private MatchStatus status = MatchStatus.NOTIFIED;

    @CreationTimestamp
    @Column(name = "notified_at", nullable = false, updatable = false)
    private Instant notifiedAt;

    @Column(name = "responded_at")
    private Instant respondedAt;
}
