package com.lifelink.escalation;

import com.lifelink.matching.DonorMatch;
import com.lifelink.matching.MatchingService;
import com.lifelink.request.BloodRequest;
import com.lifelink.request.BloodRequestRepository;
import com.lifelink.request.RequestStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EscalationService {

    private final BloodRequestRepository requestRepository;
    private final MatchingService matchingService;
    private final EscalationPolicy escalationPolicy;

    /**
     * Escalates a blood request to the next wider search radius tier when donors do not respond in time.
     */
    @Transactional
    public List<DonorMatch> escalateRequest(Long requestId) {
        BloodRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Blood request not found with ID: " + requestId));

        if (request.getStatus() == RequestStatus.MATCHED ||
                request.getStatus() == RequestStatus.FULFILLED ||
                request.getStatus() == RequestStatus.CANCELLED) {
            log.info("Request #{} is in final state {}; escalation skipped", requestId, request.getStatus());
            return List.of();
        }

        double currentRadius = request.getCurrentRadius();
        double nextRadius = getNextRadius(currentRadius);

        if (nextRadius <= currentRadius) {
            log.warn("Request #{} has already reached maximum radius ({} km)", requestId, currentRadius);
            if (request.getUnitsFulfilled() == 0) {
                request.setStatus(RequestStatus.NO_MATCH);
                requestRepository.save(request);
            }
            return List.of();
        }

        log.info("ESCALATING request #{}: Expanding search radius from {} km to {} km",
                requestId, currentRadius, nextRadius);

        request.setCurrentRadius(nextRadius);
        request.setStatus(RequestStatus.ESCALATED);
        requestRepository.save(request);

        // Run matching engine within the expanded radius
        return matchingService.findAndMatchDonors(requestId);
    }

    private double getNextRadius(double currentRadius) {
        for (EscalationPolicy.Tier tier : escalationPolicy.getTiers()) {
            if (tier.radiusKm() > currentRadius) {
                return tier.radiusKm();
            }
        }
        return currentRadius; // Already at max
    }
}
