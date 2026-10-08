package com.lifelink.donor;

import com.lifelink.donor.dto.DonorProfileRequest;
import com.lifelink.donor.dto.DonorResponse;
import com.lifelink.donor.dto.UpdateAvailabilityRequest;
import com.lifelink.donor.dto.UpdateLocationRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/donors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DonorController {

    private final DonorService donorService;

    @PostMapping("/profile")
    public ResponseEntity<DonorResponse> createOrUpdateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DonorProfileRequest request
    ) {
        DonorResponse response = donorService.createOrUpdateProfile(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<DonorResponse> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        DonorResponse response = donorService.getMyProfile(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonorResponse> getDonorById(@PathVariable Long id) {
        DonorResponse response = donorService.getDonorById(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/availability")
    public ResponseEntity<DonorResponse> updateAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateAvailabilityRequest request
    ) {
        DonorResponse response = donorService.updateAvailability(userDetails.getUsername(), request.getAvailable());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/location")
    public ResponseEntity<DonorResponse> updateLocation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateLocationRequest request
    ) {
        DonorResponse response = donorService.updateLocation(userDetails.getUsername(), request.getLatitude(), request.getLongitude());
        return ResponseEntity.ok(response);
    }
}
