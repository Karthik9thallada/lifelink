package com.lifelink.request;

import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.ComponentType;
import com.lifelink.hospital.Hospital;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "blood_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_group", nullable = false)
    private BloodGroup bloodGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "component_type", nullable = false)
    private ComponentType componentType;

    @Column(name = "units_required", nullable = false)
    private Integer unitsRequired;

    @Builder.Default
    @Column(name = "units_fulfilled", nullable = false)
    private Integer unitsFulfilled = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Urgency urgency;

    @Builder.Default
    @Column(name = "initial_radius", nullable = false)
    private Double initialRadius = 5.0;

    @Builder.Default
    @Column(name = "current_radius", nullable = false)
    private Double currentRadius = 5.0;

    @Column(name = "required_by", nullable = false)
    private LocalDateTime requiredBy;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.OPEN;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
