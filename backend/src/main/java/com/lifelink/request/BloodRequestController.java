package com.lifelink.request;

import com.lifelink.request.dto.BloodRequestResponse;
import com.lifelink.request.dto.CreateBloodRequestDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BloodRequestController {

    private final BloodRequestService bloodRequestService;

    @PostMapping
    public ResponseEntity<BloodRequestResponse> createRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateBloodRequestDto requestDto
    ) {
        BloodRequestResponse response = bloodRequestService.createRequest(userDetails.getUsername(), requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BloodRequestResponse> getRequestById(@PathVariable Long id) {
        BloodRequestResponse response = bloodRequestService.getRequestById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/hospital/my")
    public ResponseEntity<List<BloodRequestResponse>> getMyHospitalRequests(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<BloodRequestResponse> responses = bloodRequestService.getMyHospitalRequests(userDetails.getUsername());
        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BloodRequestResponse> cancelRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        BloodRequestResponse response = bloodRequestService.cancelRequest(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }
}
