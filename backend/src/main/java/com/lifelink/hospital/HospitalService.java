package com.lifelink.hospital;

import com.lifelink.auth.Role;
import com.lifelink.auth.User;
import com.lifelink.auth.UserRepository;
import com.lifelink.hospital.dto.HospitalProfileRequest;
import com.lifelink.hospital.dto.HospitalResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    @Transactional
    public HospitalResponse createOrUpdateProfile(String userEmail, HospitalProfileRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        if (user.getRole() != Role.HOSPITAL && user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("User does not have HOSPITAL role");
        }

        Hospital hospital = hospitalRepository.findByUserId(user.getId())
                .orElseGet(() -> Hospital.builder().user(user).build());

        hospital.setHospitalName(request.getHospitalName().trim());
        hospital.setAddress(request.getAddress().trim());
        hospital.setEmergencyPhone(request.getEmergencyPhone().trim());
        hospital.setLicenseNumber(request.getLicenseNumber().trim());

        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));
        hospital.setLocation(point);

        Hospital saved = hospitalRepository.save(hospital);
        log.info("Hospital profile updated for user {}: Name='{}', Verified={}",
                userEmail, saved.getHospitalName(), saved.getVerified());

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public HospitalResponse getMyHospital(String userEmail) {
        Hospital hospital = hospitalRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Hospital profile not found for user: " + userEmail));
        return mapToResponse(hospital);
    }

    @Transactional(readOnly = true)
    public HospitalResponse getHospitalById(Long id) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hospital not found with ID: " + id));
        return mapToResponse(hospital);
    }

    @Transactional(readOnly = true)
    public List<HospitalResponse> getAllVerifiedHospitals() {
        return hospitalRepository.findByVerifiedTrue().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public HospitalResponse verifyHospital(Long id, boolean verified) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hospital not found with ID: " + id));

        hospital.setVerified(verified);
        Hospital saved = hospitalRepository.save(hospital);
        log.info("Hospital ID {} verification status changed to: {}", id, verified);

        return mapToResponse(saved);
    }

    public HospitalResponse mapToResponse(Hospital hospital) {
        Double lat = hospital.getLocation() != null ? hospital.getLocation().getY() : null;
        Double lon = hospital.getLocation() != null ? hospital.getLocation().getX() : null;

        return HospitalResponse.builder()
                .id(hospital.getId())
                .userId(hospital.getUser().getId())
                .hospitalName(hospital.getHospitalName())
                .address(hospital.getAddress())
                .emergencyPhone(hospital.getEmergencyPhone())
                .licenseNumber(hospital.getLicenseNumber())
                .verified(hospital.getVerified())
                .latitude(lat)
                .longitude(lon)
                .build();
    }
}
