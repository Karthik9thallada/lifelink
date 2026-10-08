package com.lifelink.matching;

import com.lifelink.donor.ComponentType;
import com.lifelink.donor.Donor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EligibilityService {

    @Value("${lifelink.eligibility.whole-blood-min-gap-days:56}")
    private long wholeBloodMinGapDays = 56;

    @Value("${lifelink.eligibility.plasma-min-gap-days:14}")
    private long plasmaMinGapDays = 14;

    @Value("${lifelink.eligibility.platelets-min-gap-days:7}")
    private long plateletsMinGapDays = 7;

    public EligibilityResult evaluateEligibility(Donor donor, ComponentType componentType) {
        return evaluateEligibility(donor, componentType, LocalDate.now());
    }

    public EligibilityResult evaluateEligibility(Donor donor, ComponentType componentType, LocalDate evaluationDate) {
        List<String> reasons = new ArrayList<>();
        long daysRemaining = 0;

        // 1. Live Availability Check
        if (Boolean.FALSE.equals(donor.getAvailable())) {
            reasons.add("Donor live availability is set to OFF");
        }

        // 2. Component Type Preference Match
        if (donor.getComponentType() != null && donor.getComponentType() != componentType) {
            // Whole blood donors can optionally donate RBC
            boolean compatibleType = (donor.getComponentType() == ComponentType.WHOLE_BLOOD && componentType == ComponentType.RBC);
            if (!compatibleType) {
                reasons.add(String.format("Donor registered component type (%s) does not match requested component (%s)",
                        donor.getComponentType(), componentType));
            }
        }

        // 3. Minimum Donation Interval Rule
        if (donor.getLastDonationDate() != null) {
            long daysSinceLast = ChronoUnit.DAYS.between(donor.getLastDonationDate(), evaluationDate);
            long requiredGap = switch (componentType) {
                case WHOLE_BLOOD, RBC -> wholeBloodMinGapDays;
                case PLASMA -> plasmaMinGapDays;
                case PLATELETS -> plateletsMinGapDays;
            };

            if (daysSinceLast < requiredGap) {
                long remaining = requiredGap - daysSinceLast;
                reasons.add(String.format("Minimum donation interval not met: %d days elapsed, %d days required (%d days remaining)",
                        daysSinceLast, requiredGap, remaining));
                daysRemaining = Math.max(daysRemaining, remaining);
            }
        }

        if (reasons.isEmpty()) {
            return EligibilityResult.eligible();
        } else {
            return EligibilityResult.ineligible(reasons, daysRemaining > 0 ? daysRemaining : null);
        }
    }

    public boolean isDonorEligible(Donor donor, ComponentType componentType) {
        return evaluateEligibility(donor, componentType).isEligible();
    }
}
