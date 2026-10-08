package com.lifelink.hospital.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalProfileRequest {

    @NotBlank(message = "Hospital name is required")
    private String hospitalName;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "Emergency contact phone is required")
    private String emergencyPhone;

    @NotBlank(message = "Hospital license number is required")
    private String licenseNumber;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    private Double longitude;

    @com.fasterxml.jackson.annotation.JsonProperty("location")
    public void setLocation(java.util.Map<String, Object> loc) {
        if (loc != null) {
            if (loc.containsKey("latitude") && loc.get("latitude") instanceof Number n) {
                this.latitude = n.doubleValue();
            }
            if (loc.containsKey("longitude") && loc.get("longitude") instanceof Number n) {
                this.longitude = n.doubleValue();
            }
        }
    }
}
