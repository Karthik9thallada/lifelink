package com.lifelink.config;

import com.lifelink.auth.Role;
import com.lifelink.auth.User;
import com.lifelink.auth.UserRepository;
import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.ComponentType;
import com.lifelink.donor.Donor;
import com.lifelink.donor.DonorRepository;
import com.lifelink.hospital.Hospital;
import com.lifelink.hospital.HospitalRepository;
import com.lifelink.matching.MatchingService;
import com.lifelink.request.BloodRequest;
import com.lifelink.request.BloodRequestRepository;
import com.lifelink.request.RequestStatus;
import com.lifelink.request.Urgency;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final DonorRepository donorRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final PasswordEncoder passwordEncoder;
    private final MatchingService matchingService;

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@lifelink.org").isPresent()) {
            log.info("Demo database already seeded; skipping DataSeeder");
            return;
        }

        log.info("🌱 Seeding demo emergency grid network for LifeLink...");

        // 1. Admin
        userRepository.save(User.builder()
                .name("System Administrator")
                .email("admin@lifelink.org")
                .password(passwordEncoder.encode("admin123"))
                .phone("+918000000000")
                .role(Role.ADMIN)
                .build());

        // 2. Hospitals
        // Apex Emergency Hospital (MG Road Central: Lat 12.9716, Lon 77.5946)
        User apexUser = userRepository.save(User.builder()
                .name("Dr. Arvind Raman")
                .email("apex@lifelink.org")
                .password(passwordEncoder.encode("password123"))
                .phone("+918022114455")
                .role(Role.HOSPITAL)
                .build());

        Hospital apexHospital = hospitalRepository.save(Hospital.builder()
                .user(apexUser)
                .hospitalName("Apex Emergency Hospital")
                .address("MG Road, Central Bangalore")
                .emergencyPhone("+918022114400")
                .licenseNumber("HOSP-BLR-001")
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.5946, 12.9716)))
                .verified(true)
                .build());

        // Manipal Emergency Hospital (HAL Airport Road: Lat 12.9583, Lon 77.6534)
        User manipalUser = userRepository.save(User.builder()
                .name("Dr. Neha Shenoy")
                .email("manipal@lifelink.org")
                .password(passwordEncoder.encode("password123"))
                .phone("+918025024444")
                .role(Role.HOSPITAL)
                .build());

        hospitalRepository.save(Hospital.builder()
                .user(manipalUser)
                .hospitalName("Manipal Hospital Trauma Center")
                .address("98 HAL Airport Road, Bangalore")
                .emergencyPhone("+918025024400")
                .licenseNumber("HOSP-BLR-002")
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.6534, 12.9583)))
                .verified(true)
                .build());

        // 3. Donors
        // Donor A: Rahul Sharma (O+ Whole Blood, Indiranagar: Lat 12.9784, Lon 77.6408 - ~2.5 km away)
        User rahulUser = userRepository.save(User.builder()
                .name("Rahul Sharma")
                .email("donora.escl@lifelink.org")
                .password(passwordEncoder.encode("password123"))
                .phone("+919900112233")
                .role(Role.DONOR)
                .build());

        donorRepository.save(Donor.builder()
                .user(rahulUser)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .componentType(ComponentType.WHOLE_BLOOD)
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.6408, 12.9784)))
                .lastDonationDate(LocalDate.now().minusDays(85))
                .available(true)
                .eligible(true)
                .build());

        // Donor B: Sunita Rao (O+ Whole Blood, Whitefield: Lat 12.9698, Lon 77.7499 - ~8.2 km away)
        User sunitaUser = userRepository.save(User.builder()
                .name("Sunita Rao")
                .email("donorb.escl@lifelink.org")
                .password(passwordEncoder.encode("password123"))
                .phone("+919900223344")
                .role(Role.DONOR)
                .build());

        donorRepository.save(Donor.builder()
                .user(sunitaUser)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .componentType(ComponentType.WHOLE_BLOOD)
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.7499, 12.9698)))
                .lastDonationDate(LocalDate.now().minusDays(70))
                .available(true)
                .eligible(true)
                .build());

        // Donor C: Vikram Singh (B+ Whole Blood, Koramangala: Lat 12.9352, Lon 77.6245 - ~4.5 km away)
        User vikramUser = userRepository.save(User.builder()
                .name("Vikram Singh")
                .email("vikram@lifelink.org")
                .password(passwordEncoder.encode("password123"))
                .phone("+919900334455")
                .role(Role.DONOR)
                .build());

        donorRepository.save(Donor.builder()
                .user(vikramUser)
                .bloodGroup(BloodGroup.B_POSITIVE)
                .componentType(ComponentType.WHOLE_BLOOD)
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.6245, 12.9352)))
                .lastDonationDate(LocalDate.now().minusDays(95))
                .available(true)
                .eligible(true)
                .build());

        // Donor D: Priya Patel (AB+ Plasma, MG Road: Lat 12.9716, Lon 77.5946 - 0.2 km away)
        User priyaUser = userRepository.save(User.builder()
                .name("Priya Patel")
                .email("priya.donor@lifelink.org")
                .password(passwordEncoder.encode("password123"))
                .phone("+919900445566")
                .role(Role.DONOR)
                .build());

        donorRepository.save(Donor.builder()
                .user(priyaUser)
                .bloodGroup(BloodGroup.AB_POSITIVE)
                .componentType(ComponentType.PLASMA)
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.5960, 12.9716)))
                .lastDonationDate(LocalDate.now().minusDays(30))
                .available(true)
                .eligible(true)
                .build());

        // 4. Initial Emergency Blood Request for Apex Hospital
        BloodRequest sampleReq = bloodRequestRepository.save(BloodRequest.builder()
                .hospital(apexHospital)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .componentType(ComponentType.WHOLE_BLOOD)
                .unitsRequired(2)
                .unitsFulfilled(0)
                .urgency(Urgency.CRITICAL)
                .initialRadius(5.0)
                .currentRadius(5.0)
                .requiredBy(LocalDateTime.now().plusHours(2))
                .status(RequestStatus.OPEN)
                .notes("ICU Trauma Emergency: Patient in Critical Condition (Blood Loss)")
                .build());

        // Execute initial matching so Rahul Sharma is matched immediately!
        matchingService.findAndMatchDonors(sampleReq.getId());

        log.info("✅ LifeLink demo grid seeded successfully with 2 Hospitals, 4 Donors, and 1 Active ICU Request!");
    }
}
