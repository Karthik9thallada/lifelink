package com.lifelink.hospital;

import com.lifelink.hospital.dto.HospitalProfileRequest;
import com.lifelink.hospital.dto.HospitalResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HospitalController {

    private final HospitalService hospitalService;

    @PostMapping("/profile")
    public ResponseEntity<HospitalResponse> createOrUpdateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody HospitalProfileRequest request
    ) {
        HospitalResponse response = hospitalService.createOrUpdateProfile(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<HospitalResponse> getMyHospital(@AuthenticationPrincipal UserDetails userDetails) {
        HospitalResponse response = hospitalService.getMyHospital(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<HospitalResponse> getHospitalById(@PathVariable Long id) {
        HospitalResponse response = hospitalService.getHospitalById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<HospitalResponse>> getAllVerifiedHospitals() {
        List<HospitalResponse> responses = hospitalService.getAllVerifiedHospitals();
        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/{id}/verify")
    public ResponseEntity<HospitalResponse> verifyHospital(
            @PathVariable Long id,
            @RequestParam boolean verified
    ) {
        HospitalResponse response = hospitalService.verifyHospital(id, verified);
        return ResponseEntity.ok(response);
    }
}
