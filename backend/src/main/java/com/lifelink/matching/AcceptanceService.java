package com.lifelink.matching;

import com.lifelink.config.RedisLockService;
import com.lifelink.donor.Donor;
import com.lifelink.donor.DonorRepository;
import com.lifelink.request.BloodRequest;
import com.lifelink.request.BloodRequestRepository;
import com.lifelink.request.RequestStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcceptanceService {

    private final BloodRequestRepository requestRepository;
    private final DonorMatchRepository matchRepository;
    private final DonorRepository donorRepository;
    private final RedisLockService redisLockService;

    /**
     * Atomically handles donor acceptance using distributed locking.
     * Prevents over-acceptance and race conditions.
     */
    @Transactional
    public AcceptanceResponse acceptRequest(Long requestId, String donorEmail) {
        Donor donor = donorRepository.findByUserEmail(donorEmail)
                .orElseThrow(() -> new IllegalArgumentException("Donor profile not found for user: " + donorEmail));

        String lockKey = "request:" + requestId + ":lock";
        boolean lockAcquired = redisLockService.acquireLock(lockKey, 5);

        if (!lockAcquired) {
            return AcceptanceResponse.builder()
                    .success(false)
                    .message("System is currently processing another acceptance for this request. Please try again.")
                    .requestId(requestId)
                    .donorId(donor.getId())
                    .build();
        }

        try {
            BloodRequest request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new IllegalArgumentException("Blood request not found with ID: " + requestId));

            // Verify request is still active
            if (request.getStatus() == RequestStatus.MATCHED ||
                    request.getStatus() == RequestStatus.FULFILLED ||
                    request.getUnitsFulfilled() >= request.getUnitsRequired()) {
                return AcceptanceResponse.builder()
                        .success(false)
                        .message("This blood request has already been fulfilled by another donor.")
                        .requestId(requestId)
                        .donorId(donor.getId())
                        .requestStatus(request.getStatus())
                        .unitsFulfilled(request.getUnitsFulfilled())
                        .unitsRequired(request.getUnitsRequired())
                        .build();
            }

            if (request.getStatus() == RequestStatus.CANCELLED || request.getStatus() == RequestStatus.EXPIRED) {
                return AcceptanceResponse.builder()
                        .success(false)
                        .message("This request is no longer active (Status: " + request.getStatus() + ").")
                        .requestId(requestId)
                        .donorId(donor.getId())
                        .requestStatus(request.getStatus())
                        .build();
            }

            DonorMatch match = matchRepository.findByRequestIdAndDonorId(requestId, donor.getId())
                    .orElseThrow(() -> new IllegalArgumentException("No match record found for this donor and request"));

            if (match.getStatus() == MatchStatus.ACCEPTED) {
                return AcceptanceResponse.builder()
                        .success(true)
                        .message("You have already accepted this request.")
                        .requestId(requestId)
                        .donorId(donor.getId())
                        .requestStatus(request.getStatus())
                        .unitsFulfilled(request.getUnitsFulfilled())
                        .unitsRequired(request.getUnitsRequired())
                        .build();
            }

            // Accept the match
            match.setStatus(MatchStatus.ACCEPTED);
            match.setRespondedAt(Instant.now());
            matchRepository.save(match);

            // Increment fulfilled units
            int newFulfilled = request.getUnitsFulfilled() + 1;
            request.setUnitsFulfilled(newFulfilled);

            if (newFulfilled >= request.getUnitsRequired()) {
                request.setStatus(RequestStatus.MATCHED);

                // Expire/reject remaining notified donors
                List<DonorMatch> remaining = matchRepository.findByRequestIdAndStatus(requestId, MatchStatus.NOTIFIED);
                for (DonorMatch rem : remaining) {
                    rem.setStatus(MatchStatus.EXPIRED);
                    matchRepository.save(rem);
                }
            }

            requestRepository.save(request);

            log.info("Donor #{} ({}) ACCEPTED request #{}. Units: {}/{}",
                    donor.getId(), donor.getUser().getName(), requestId, newFulfilled, request.getUnitsRequired());

            return AcceptanceResponse.builder()
                    .success(true)
                    .message("Donation accepted successfully! The hospital has been notified.")
                    .requestId(requestId)
                    .donorId(donor.getId())
                    .requestStatus(request.getStatus())
                    .unitsFulfilled(newFulfilled)
                    .unitsRequired(request.getUnitsRequired())
                    .build();

        } finally {
            redisLockService.releaseLock(lockKey);
        }
    }
}
