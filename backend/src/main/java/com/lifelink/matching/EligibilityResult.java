package com.lifelink.matching;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EligibilityResult {

    private boolean eligible;
    @Builder.Default
    private List<String> reasons = new ArrayList<>();
    private Long daysRemainingUntilEligible;

    public static EligibilityResult eligible() {
        return EligibilityResult.builder()
                .eligible(true)
                .reasons(new ArrayList<>())
                .build();
    }

    public static EligibilityResult ineligible(List<String> reasons, Long daysRemaining) {
        return EligibilityResult.builder()
                .eligible(false)
                .reasons(reasons)
                .daysRemainingUntilEligible(daysRemaining)
                .build();
    }
}
