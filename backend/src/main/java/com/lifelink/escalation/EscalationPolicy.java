package com.lifelink.escalation;

import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Getter
public class EscalationPolicy {

    public record Tier(int level, double radiusKm, int timeoutSeconds) {}

    private final List<Tier> tiers = List.of(
            new Tier(1, 5.0, 120),
            new Tier(2, 10.0, 180),
            new Tier(3, 25.0, 300),
            new Tier(4, 50.0, 300)
    );

    public Tier getTier(int level) {
        if (level < 1 || level > tiers.size()) {
            return null;
        }
        return tiers.get(level - 1);
    }

    public int getMaxLevel() {
        return tiers.size();
    }
}
