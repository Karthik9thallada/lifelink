package com.lifelink.donor.dto;

import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.ComponentType;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonorResponse {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private BloodGroup bloodGroup;
    private ComponentType componentType;
    private LocalDate lastDonationDate;
    private Boolean available;
    private Boolean eligible;
    private Double latitude;
    private Double longitude;
}
