package com.lifelink.donor;

import com.lifelink.auth.Role;
import com.lifelink.auth.User;
import com.lifelink.auth.UserRepository;
import com.lifelink.donor.dto.DonorProfileRequest;
import com.lifelink.donor.dto.DonorResponse;
import com.lifelink.donor.dto.LocationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class DonorService {

    private final DonorRepository donorRepository;
    private final UserRepository userRepository;

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);
    private static final int MIN_GAP_DAYS = 56; // Standard 8-week gap

    @Transactional
    public DonorResponse createOrUpdateProfile(String userEmail, DonorProfileRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        if (user.getRole() != Role.DONOR && user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("User does not have DONOR role");
        }

        Donor donor = donorRepository.findByUserId(user.getId())
                .orElseGet(() -> Donor.builder().user(user).build());

        donor.setBloodGroup(request.getBloodGroup());
        donor.setComponentType(request.getComponentType());
        donor.setLastDonationDate(request.getLastDonationDate());

        if (request.getAvailable() != null) {
            donor.setAvailable(request.getAvailable());
        }

        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));
        donor.setLocation(point);

        // Calculate initial eligibility based on minimum donation interval
        boolean isEligible = isEligibleByInterval(request.getLastDonationDate(), request.getComponentType());
        donor.setEligible(isEligible);

        Donor saved = donorRepository.save(donor);
        log.info("Donor profile updated for user {}: Blood={}, Component={}, Available={}, Eligible={}",
                userEmail, saved.getBloodGroup(), saved.getComponentType(), saved.getAvailable(), saved.getEligible());

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public DonorResponse getMyProfile(String userEmail) {
        Donor donor = donorRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Donor profile not found for user: " + userEmail));
        return mapToResponse(donor);
    }

    @Transactional(readOnly = true)
    public DonorResponse getDonorById(Long donorId) {
        Donor donor = donorRepository.findById(donorId)
                .orElseThrow(() -> new IllegalArgumentException("Donor not found with ID: " + donorId));
        return mapToResponse(donor);
    }

    @Transactional
    public DonorResponse updateAvailability(String userEmail, boolean available) {
        Donor donor = donorRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Donor profile not found for user: " + userEmail));

        donor.setAvailable(available);
        Donor saved = donorRepository.save(donor);
        log.info("Updated availability for donor {} to {}", userEmail, available);

        return mapToResponse(saved);
    }

    @Transactional
    public DonorResponse updateLocation(String userEmail, Double latitude, Double longitude) {
        Donor donor = donorRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Donor profile not found for user: " + userEmail));

        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        donor.setLocation(point);
        Donor saved = donorRepository.save(donor);
        log.info("Updated live GPS location for donor {}: [lat={}, lon={}]", userEmail, latitude, longitude);

        return mapToResponse(saved);
    }

    public boolean isEligibleByInterval(LocalDate lastDonationDate, ComponentType componentType) {
        if (lastDonationDate == null) {
            return true;
        }

        long daysSince = ChronoUnit.DAYS.between(lastDonationDate, LocalDate.now());
        long requiredGap = switch (componentType) {
            case WHOLE_BLOOD, RBC -> MIN_GAP_DAYS; // 56 days
            case PLASMA -> 14;                     // 14 days
            case PLATELETS -> 7;                   // 7 days
        };

        return daysSince >= requiredGap;
    }

    public DonorResponse mapToResponse(Donor donor) {
        Double lat = donor.getLocation() != null ? donor.getLocation().getY() : null;
        Double lon = donor.getLocation() != null ? donor.getLocation().getX() : null;

        return DonorResponse.builder()
                .id(donor.getId())
                .userId(donor.getUser().getId())
                .name(donor.getUser().getName())
                .email(donor.getUser().getEmail())
                .phone(donor.getUser().getPhone())
                .bloodGroup(donor.getBloodGroup())
                .componentType(donor.getComponentType())
                .lastDonationDate(donor.getLastDonationDate())
                .available(donor.getAvailable())
                .eligible(donor.getEligible())
                .latitude(lat)
                .longitude(lon)
                .build();
    }
}
