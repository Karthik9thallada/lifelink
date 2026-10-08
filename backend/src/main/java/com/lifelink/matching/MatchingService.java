package com.lifelink.matching;

import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.Donor;
import com.lifelink.donor.DonorRepository;
import com.lifelink.request.BloodRequest;
import com.lifelink.request.BloodRequestRepository;
import com.lifelink.request.RequestStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingService {

    private final BloodRequestRepository requestRepository;
    private final DonorRepository donorRepository;
    private final DonorMatchRepository matchRepository;
    private final CompatibilityService compatibilityService;
    private final EligibilityService eligibilityService;
    private final RankingService rankingService;
    private final com.lifelink.notification.NotificationService notificationService;

    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Finds, ranks, and matches compatible and eligible donors for a blood request within its current radius.
     */
    @Transactional
    public List<DonorMatch> findAndMatchDonors(Long requestId) {
        BloodRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Blood request not found with ID: " + requestId));

        if (request.getStatus() == RequestStatus.FULFILLED || request.getStatus() == RequestStatus.CANCELLED) {
            log.info("Request #{} is already {}; skipping matching", requestId, request.getStatus());
            return List.of();
        }

        // 1. Get biologically compatible donor blood groups
        Set<BloodGroup> compatibleGroups = compatibilityService.getCompatibleDonorGroups(
                request.getBloodGroup(),
                request.getComponentType()
        );

        if (compatibleGroups.isEmpty()) {
            log.warn("No compatible blood groups for request #{}: {} ({})",
                    requestId, request.getBloodGroup(), request.getComponentType());
            request.setStatus(RequestStatus.NO_MATCH);
            requestRepository.save(request);
            return List.of();
        }

        double hospitalLat = request.getHospital().getLocation().getY();
        double hospitalLon = request.getHospital().getLocation().getX();
        double maxRadiusKm = request.getCurrentRadius();

        // 2. Fetch candidate donors who are available and have compatible blood group
        List<Donor> candidateDonors = donorRepository.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.getAvailable()))
                .filter(d -> compatibleGroups.contains(d.getBloodGroup()))
                .filter(d -> d.getLocation() != null)
                .filter(d -> !matchRepository.existsByRequestIdAndDonorId(requestId, d.getId()))
                .toList();

        List<DonorMatch> newMatches = new ArrayList<>();

        for (Donor candidate : candidateDonors) {
            // 3. Evaluate medical & interval eligibility rules
            if (!eligibilityService.isDonorEligible(candidate, request.getComponentType())) {
                continue;
            }

            // 4. Calculate spatial distance from hospital
            double donorLat = candidate.getLocation().getY();
            double donorLon = candidate.getLocation().getX();
            double distanceKm = calculateHaversineDistance(hospitalLat, hospitalLon, donorLat, donorLon);

            if (distanceKm <= maxRadiusKm) {
                double score = rankingService.calculateScore(candidate, distanceKm);

                DonorMatch match = DonorMatch.builder()
                        .request(request)
                        .donor(candidate)
                        .distance(Math.round(distanceKm * 100.0) / 100.0)
                        .score(score)
                        .status(MatchStatus.NOTIFIED)
                        .build();

                newMatches.add(match);
            }
        }

        // 5. Rank by distance (closest first), then by score descending
        newMatches.sort(Comparator.comparingDouble(DonorMatch::getDistance));

        List<DonorMatch> savedMatches = matchRepository.saveAll(newMatches);

        // 6. Update request lifecycle status
        if (!savedMatches.isEmpty()) {
            request.setStatus(RequestStatus.SEARCHING);
        } else if (matchRepository.countByRequestId(requestId) == 0) {
            request.setStatus(RequestStatus.SEARCHING); // remains searching awaiting radius expansion
        }
        requestRepository.save(request);

        // 7. Dispatch WebSocket notifications
        for (DonorMatch match : savedMatches) {
            notificationService.notifyDonor(
                    match.getDonor().getId(),
                    "EMERGENCY_MATCH",
                    requestId,
                    null,
                    "Urgent " + request.getBloodGroup() + " " + request.getComponentType() +
                            " required at " + request.getHospital().getHospitalName() +
                            " (" + match.getDistance() + " km away)"
            );
        }

        if (!savedMatches.isEmpty()) {
            notificationService.notifyRequestUpdate(
                    requestId,
                    "MATCHES_FOUND",
                    savedMatches.size(),
                    savedMatches.size() + " compatible donors notified within " + maxRadiusKm + " km radius"
            );
        }

        log.info("Request #{}: Found and created {} new donor matches within {} km radius",
                requestId, savedMatches.size(), maxRadiusKm);

        return savedMatches;
    }

    /**
     * Calculates great-circle distance between two GPS coordinates using Haversine formula.
     */
    public static double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
