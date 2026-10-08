package com.lifelink.matching;

import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.ComponentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CompatibilityServiceTest {

    private final CompatibilityService compatibilityService = new CompatibilityService();

    @Test
    @DisplayName("RBC: O- recipient can only receive from O-")
    void testONegativeRbcCompatibility() {
        Set<BloodGroup> compatible = compatibilityService.getCompatibleDonorGroups(BloodGroup.O_NEGATIVE, ComponentType.RBC);
        assertThat(compatible).containsExactly(BloodGroup.O_NEGATIVE);
    }

    @Test
    @DisplayName("RBC: AB+ recipient can receive from all 8 blood groups (Universal RBC Recipient)")
    void testABPositiveRbcUniversalRecipient() {
        Set<BloodGroup> compatible = compatibilityService.getCompatibleDonorGroups(BloodGroup.AB_POSITIVE, ComponentType.RBC);
        assertThat(compatible).containsExactlyInAnyOrder(BloodGroup.values());
    }

    @Test
    @DisplayName("RBC: O- is universal donor for all recipients")
    void testONegativeIsUniversalRbcDonor() {
        for (BloodGroup recipient : BloodGroup.values()) {
            boolean isCompat = compatibilityService.isCompatible(recipient, BloodGroup.O_NEGATIVE, ComponentType.RBC);
            assertThat(isCompat)
                    .withFailMessage("O- should be compatible with recipient: " + recipient)
                    .isTrue();
        }
    }

    @Test
    @DisplayName("Plasma: AB is universal plasma donor (can donate plasma to all recipients)")
    void testABIsUniversalPlasmaDonor() {
        for (BloodGroup recipient : BloodGroup.values()) {
            boolean isCompat = compatibilityService.isCompatible(recipient, BloodGroup.AB_POSITIVE, ComponentType.PLASMA);
            assertThat(isCompat)
                    .withFailMessage("AB+ plasma should be compatible with recipient: " + recipient)
                    .isTrue();
        }
    }

    @Test
    @DisplayName("Plasma: O recipient can receive plasma from all groups (Universal Plasma Recipient)")
    void testOPositivePlasmaUniversalRecipient() {
        Set<BloodGroup> compatible = compatibilityService.getCompatibleDonorGroups(BloodGroup.O_POSITIVE, ComponentType.PLASMA);
        assertThat(compatible).containsExactlyInAnyOrder(BloodGroup.values());
    }

    @Test
    @DisplayName("Plasma: AB recipient can only receive plasma from AB donors")
    void testABRecipientPlasmaCompatibility() {
        Set<BloodGroup> compatible = compatibilityService.getCompatibleDonorGroups(BloodGroup.AB_POSITIVE, ComponentType.PLASMA);
        assertThat(compatible).containsExactlyInAnyOrder(BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE);
    }
}
