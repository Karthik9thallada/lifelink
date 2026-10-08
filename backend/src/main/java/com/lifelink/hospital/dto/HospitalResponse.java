package com.lifelink.hospital.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalResponse {

    private Long id;
    private Long userId;
    private String hospitalName;
    private String address;
    private String emergencyPhone;
    private String licenseNumber;
    private Boolean verified;
    private Double latitude;
    private Double longitude;
}
