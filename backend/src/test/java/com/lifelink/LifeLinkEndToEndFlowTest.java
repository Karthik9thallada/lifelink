package com.lifelink;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifelink.auth.Role;
import com.lifelink.auth.User;
import com.lifelink.auth.UserRepository;
import com.lifelink.auth.dto.AuthResponse;
import com.lifelink.auth.dto.RegisterRequest;
import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.ComponentType;
import com.lifelink.donor.Donor;
import com.lifelink.donor.DonorRepository;
import com.lifelink.escalation.EscalationService;
import com.lifelink.hospital.Hospital;
import com.lifelink.hospital.HospitalRepository;
import com.lifelink.matching.*;
import com.lifelink.request.BloodRequest;
import com.lifelink.request.BloodRequestRepository;
import com.lifelink.request.RequestStatus;
import com.lifelink.request.Urgency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class LifeLinkEndToEndFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private BloodRequestRepository requestRepository;

    @Autowired
    private DonorMatchRepository matchRepository;

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private EscalationService escalationService;

    @Autowired
    private AcceptanceService acceptanceService;

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private String hospitalToken;
    private String donor1Token;
    private String donor2Token;

    private Long donor1Id;
    private Long donor2Id;
    private Long donor3Id;
    private Long donor4Id;

    private Long bloodRequestId;

    @BeforeEach
    void setUp() throws Exception {
        matchRepository.deleteAll();
        requestRepository.deleteAll();
        donorRepository.deleteAll();
        hospitalRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Hospital: Central ER (Lat 12.9716, Lon 77.5946)
        hospitalToken = registerUser("Central Trauma Care", "central.er@lifelink.org", "+918012349999", Role.HOSPITAL);
        User hospUser = userRepository.findByEmail("central.er@lifelink.org").orElseThrow();
        Hospital hospital = hospitalRepository.save(Hospital.builder()
                .user(hospUser)
                .hospitalName("Central Trauma Care Hospital")
                .address("MG Road, Bangalore")
                .emergencyPhone("+918012349999")
                .licenseNumber("HOSP-BLR-001")
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.5946, 12.9716)))
                .verified(true)
                .build());

        // 2. Donor 1: O+ Whole Blood (~2.2 km away - Indiranagar direction), Eligible (90 days since donation)
        donor1Token = registerUser("Rahul Sharma", "rahul.e2e@lifelink.org", "+919911111111", Role.DONOR);
        Donor d1 = createDonorProfile("rahul.e2e@lifelink.org", BloodGroup.O_POSITIVE, ComponentType.WHOLE_BLOOD, 77.6150, 12.9716, 90, true);
        donor1Id = d1.getId();

        // 3. Donor 2: O+ Whole Blood (~8.2 km away - Outside 5km, inside 10km), Eligible (60 days)
        donor2Token = registerUser("Sunita Rao", "sunita.e2e@lifelink.org", "+919922222222", Role.DONOR);
        Donor d2 = createDonorProfile("sunita.e2e@lifelink.org", BloodGroup.O_POSITIVE, ComponentType.WHOLE_BLOOD, 77.6700, 12.9716, 60, true);
        donor2Id = d2.getId();

        // 4. Donor 3: B+ Whole Blood (~1.5 km away), Incompatible with O+ recipient
        registerUser("Vikram Singh", "vikram.e2e@lifelink.org", "+919933333333", Role.DONOR);
        Donor d3 = createDonorProfile("vikram.e2e@lifelink.org", BloodGroup.B_POSITIVE, ComponentType.WHOLE_BLOOD, 77.6080, 12.9716, 120, true);
        donor3Id = d3.getId();

        // 5. Donor 4: O+ Whole Blood (~1.0 km away), Ineligible due to 56-day interval gap violation (donated 15 days ago)
        registerUser("Ananya Patel", "ananya.e2e@lifelink.org", "+919944444444", Role.DONOR);
        Donor d4 = createDonorProfile("ananya.e2e@lifelink.org", BloodGroup.O_POSITIVE, ComponentType.WHOLE_BLOOD, 77.6030, 12.9716, 15, true);
        donor4Id = d4.getId();

        // 6. Hospital creates emergency blood request for 1 unit of O+ RBC, initial 5.0 km radius
        BloodRequest req = requestRepository.save(BloodRequest.builder()
                .hospital(hospital)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .componentType(ComponentType.RBC)
                .unitsRequired(1)
                .unitsFulfilled(0)
                .urgency(Urgency.CRITICAL)
                .initialRadius(5.0)
                .currentRadius(5.0)
                .requiredBy(LocalDateTime.now().plusHours(3))
                .status(RequestStatus.OPEN)
                .build());
        bloodRequestId = req.getId();
    }

    private String registerUser(String name, String email, String phone, Role role) throws Exception {
        RegisterRequest reg = RegisterRequest.builder()
                .name(name)
                .email(email)
                .password("pass1234")
                .phone(phone)
                .role(role)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
        return "Bearer " + auth.getToken();
    }

    private Donor createDonorProfile(String email, BloodGroup bg, ComponentType comp, double lon, double lat, int daysAgo, boolean available) {
        User user = userRepository.findByEmail(email.toLowerCase()).orElseThrow();
        Donor donor = Donor.builder()
                .user(user)
                .bloodGroup(bg)
                .componentType(comp)
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(lon, lat)))
                .lastDonationDate(LocalDate.now().minusDays(daysAgo))
                .available(available)
                .eligible(daysAgo >= 56)
                .build();
        return donorRepository.save(donor);
    }

    @Test
    @DisplayName("End-to-End Emergency Response Lifecycle: Creation -> Medical Filtering -> Radius Escalation -> Concurrency-Safe Acceptance")
    void testCompleteEmergencyResponseFlow() throws Exception {
        // Step 1: Initial Matching Engine run at Tier 1 (5.0 km)
        mockMvc.perform(post("/api/matching/requests/" + bloodRequestId + "/find")
                        .header("Authorization", hospitalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].donorName", is("Rahul Sharma"))); // Donor 1 is matched!

        // Verify biological & interval exclusions:
        // - Donor 3 (B+) excluded because incompatible
        // - Donor 4 (O+) excluded because interval < 56 days
        // - Donor 2 (O+) excluded because > 5.0 km
        assertFalse(matchRepository.existsByRequestIdAndDonorId(bloodRequestId, donor3Id));
        assertFalse(matchRepository.existsByRequestIdAndDonorId(bloodRequestId, donor4Id));
        assertFalse(matchRepository.existsByRequestIdAndDonorId(bloodRequestId, donor2Id));

        // Step 2: Escalate Request to Tier 2 (10.0 km)
        mockMvc.perform(post("/api/escalation/requests/" + bloodRequestId + "/escalate")
                        .header("Authorization", hospitalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].donorName", is("Sunita Rao"))); // Donor 2 is now notified!

        assertTrue(matchRepository.existsByRequestIdAndDonorId(bloodRequestId, donor2Id));

        // Step 3: Donor 2 accepts the donation
        mockMvc.perform(post("/api/matching/requests/" + bloodRequestId + "/accept")
                        .header("Authorization", donor2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.requestStatus", is("MATCHED")))
                .andExpect(jsonPath("$.unitsFulfilled", is(1)));

        // Step 4: Donor 1 tries to accept afterwards -> Safely rejected (slots fulfilled)
        mockMvc.perform(post("/api/matching/requests/" + bloodRequestId + "/accept")
                        .header("Authorization", donor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("already been fulfilled")));

        // Step 5: Check hospital's request status in DB
        BloodRequest fulfilledRequest = requestRepository.findById(bloodRequestId).orElseThrow();
        assertEquals(RequestStatus.MATCHED, fulfilledRequest.getStatus());
        assertEquals(1, fulfilledRequest.getUnitsFulfilled());
    }
}
