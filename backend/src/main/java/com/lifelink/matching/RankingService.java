package com.lifelink.matching;

import com.lifelink.donor.Donor;
import org.springframework.stereotype.Service;

@Service
public class RankingService {

    /**
     * Calculates ranking score based on distance, availability, and eligibility.
     * Higher score indicates higher match priority.
     */
    public double calculateScore(Donor donor, double distanceKm) {
        // Base score starts at 100 points
        double score = 100.0;

        // Proximity penalty: 2 points per km away
        score -= (distanceKm * 2.0);

        // Eligibility bonus
        if (Boolean.TRUE.equals(donor.getEligible())) {
            score += 10.0;
        }

        // Available bonus
        if (Boolean.TRUE.equals(donor.getAvailable())) {
            score += 10.0;
        }

        return Math.max(0.0, Math.round(score * 10.0) / 10.0);
    }
}
