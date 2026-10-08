package com.lifelink.escalation;

import com.lifelink.matching.DonorMatch;
import com.lifelink.matching.DonorMatchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/escalation")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EscalationController {

    private final EscalationService escalationService;

    @PostMapping("/requests/{requestId}/escalate")
    public ResponseEntity<List<DonorMatchResponse>> escalateRequest(@PathVariable Long requestId) {
        List<DonorMatch> newMatches = escalationService.escalateRequest(requestId);
        return ResponseEntity.ok(newMatches.stream().map(DonorMatchResponse::fromEntity).toList());
    }
}
