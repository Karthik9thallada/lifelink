package com.lifelink.hospital;

import com.lifelink.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "hospitals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "hospital_name", nullable = false)
    private String hospitalName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(name = "emergency_phone", nullable = false)
    private String emergencyPhone;

    @Column(name = "license_number", unique = true)
    private String licenseNumber;

    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @Builder.Default
    @Column(nullable = false)
    private Boolean verified = true;
}
