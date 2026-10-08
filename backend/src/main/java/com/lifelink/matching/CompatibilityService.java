package com.lifelink.matching;

import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.ComponentType;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

@Service
public class CompatibilityService {

    // Recipient Blood Group -> Compatible Donor Blood Groups for WHOLE BLOOD & RBC
    private static final Map<BloodGroup, Set<BloodGroup>> RED_CELLS_COMPATIBILITY = new EnumMap<>(BloodGroup.class);

    // Recipient Blood Group -> Compatible Donor Blood Groups for PLASMA (Inverted ABO rules)
    private static final Map<BloodGroup, Set<BloodGroup>> PLASMA_COMPATIBILITY = new EnumMap<>(BloodGroup.class);

    // Recipient Blood Group -> Compatible Donor Blood Groups for PLATELETS
    private static final Map<BloodGroup, Set<BloodGroup>> PLATELETS_COMPATIBILITY = new EnumMap<>(BloodGroup.class);

    static {
        // --- Red Blood Cells & Whole Blood Compatibility ---
        // Universal RBC Donor: O-
        // Universal RBC Recipient: AB+
        RED_CELLS_COMPATIBILITY.put(BloodGroup.O_NEGATIVE, EnumSet.of(BloodGroup.O_NEGATIVE));
        RED_CELLS_COMPATIBILITY.put(BloodGroup.O_POSITIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE));
        RED_CELLS_COMPATIBILITY.put(BloodGroup.A_NEGATIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.A_NEGATIVE));
        RED_CELLS_COMPATIBILITY.put(BloodGroup.A_POSITIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.A_NEGATIVE, BloodGroup.A_POSITIVE));
        RED_CELLS_COMPATIBILITY.put(BloodGroup.B_NEGATIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.B_NEGATIVE));
        RED_CELLS_COMPATIBILITY.put(BloodGroup.B_POSITIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.B_NEGATIVE, BloodGroup.B_POSITIVE));
        RED_CELLS_COMPATIBILITY.put(BloodGroup.AB_NEGATIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.A_NEGATIVE, BloodGroup.B_NEGATIVE, BloodGroup.AB_NEGATIVE));
        RED_CELLS_COMPATIBILITY.put(BloodGroup.AB_POSITIVE, EnumSet.allOf(BloodGroup.class));

        // --- Plasma Compatibility (Inverted) ---
        // Plasma contains antibodies against absent antigens:
        // Universal Plasma Donor: AB (has neither anti-A nor anti-B antibodies)
        // Universal Plasma Recipient: O (RBCs have no A/B antigens)
        PLASMA_COMPATIBILITY.put(BloodGroup.AB_POSITIVE, EnumSet.of(BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE));
        PLASMA_COMPATIBILITY.put(BloodGroup.AB_NEGATIVE, EnumSet.of(BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE));

        PLASMA_COMPATIBILITY.put(BloodGroup.A_POSITIVE, EnumSet.of(BloodGroup.A_POSITIVE, BloodGroup.A_NEGATIVE, BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE));
        PLASMA_COMPATIBILITY.put(BloodGroup.A_NEGATIVE, EnumSet.of(BloodGroup.A_POSITIVE, BloodGroup.A_NEGATIVE, BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE));

        PLASMA_COMPATIBILITY.put(BloodGroup.B_POSITIVE, EnumSet.of(BloodGroup.B_POSITIVE, BloodGroup.B_NEGATIVE, BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE));
        PLASMA_COMPATIBILITY.put(BloodGroup.B_NEGATIVE, EnumSet.of(BloodGroup.B_POSITIVE, BloodGroup.B_NEGATIVE, BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE));

        PLASMA_COMPATIBILITY.put(BloodGroup.O_POSITIVE, EnumSet.allOf(BloodGroup.class));
        PLASMA_COMPATIBILITY.put(BloodGroup.O_NEGATIVE, EnumSet.allOf(BloodGroup.class));

        // --- Platelets Compatibility ---
        PLATELETS_COMPATIBILITY.putAll(PLASMA_COMPATIBILITY);
    }

    /**
     * Determines all donor blood groups compatible with the recipient for the requested blood component.
     */
    public Set<BloodGroup> getCompatibleDonorGroups(BloodGroup recipientGroup, ComponentType componentType) {
        if (recipientGroup == null || componentType == null) {
            return Set.of();
        }

        return switch (componentType) {
            case WHOLE_BLOOD, RBC -> RED_CELLS_COMPATIBILITY.getOrDefault(recipientGroup, Set.of());
            case PLASMA -> PLASMA_COMPATIBILITY.getOrDefault(recipientGroup, Set.of());
            case PLATELETS -> PLATELETS_COMPATIBILITY.getOrDefault(recipientGroup, Set.of());
        };
    }

    /**
     * Checks if a specific donor is biologically compatible with a recipient.
     */
    public boolean isCompatible(BloodGroup recipientGroup, BloodGroup donorGroup, ComponentType componentType) {
        if (recipientGroup == null || donorGroup == null || componentType == null) {
            return false;
        }
        return getCompatibleDonorGroups(recipientGroup, componentType).contains(donorGroup);
    }
}
