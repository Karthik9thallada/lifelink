package com.lifelink.request.dto;

import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.ComponentType;
import com.lifelink.request.Urgency;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBloodRequestDto {

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    @NotNull(message = "Component type is required")
    private ComponentType componentType;

    @NotNull(message = "Units required is required")
    @Min(value = 1, message = "Units required must be at least 1")
    private Integer unitsRequired;

    @NotNull(message = "Urgency level is required")
    private Urgency urgency;

    @NotNull(message = "Required by timestamp is required")
    @Future(message = "Required by time must be in the future")
    private LocalDateTime requiredBy;

    private Double initialRadius;

    private String notes;
}
