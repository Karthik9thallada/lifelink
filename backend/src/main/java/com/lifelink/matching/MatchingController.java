package com.lifelink.matching;

import com.lifelink.donor.Donor;
import com.lifelink.donor.DonorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MatchingController {

    private final MatchingService matchingService;
    private final DonorMatchRepository matchRepository;
    private final DonorRepository donorRepository;

    @PostMapping("/requests/{requestId}/find")
    public ResponseEntity<List<DonorMatchResponse>> findDonorsForRequest(@PathVariable Long requestId) {
        List<DonorMatch> matches = matchingService.findAndMatchDonors(requestId);
        return ResponseEntity.ok(matches.stream().map(DonorMatchResponse::fromEntity).toList());
    }

    @GetMapping("/requests/{requestId}/matches")
    public ResponseEntity<List<DonorMatchResponse>> getMatchesForRequest(@PathVariable Long requestId) {
        List<DonorMatch> matches = matchRepository.findByRequestIdOrderByDistanceAsc(requestId);
        return ResponseEntity.ok(matches.stream().map(DonorMatchResponse::fromEntity).toList());
    }

    @GetMapping("/donors/me/matches")
    public ResponseEntity<List<DonorMatchResponse>> getMyMatches(@AuthenticationPrincipal UserDetails userDetails) {
        Donor donor = donorRepository.findByUserEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Donor profile not found"));

        List<DonorMatch> matches = matchRepository.findByDonorIdOrderByNotifiedAtDesc(donor.getId());
        return ResponseEntity.ok(matches.stream().map(DonorMatchResponse::fromEntity).toList());
    }
}
