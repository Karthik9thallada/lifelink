package com.lifelink.escalation;

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
import com.lifelink.hospital.Hospital;
import com.lifelink.hospital.HospitalRepository;
import com.lifelink.matching.DonorMatchRepository;
import com.lifelink.matching.MatchingService;
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

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EscalationAndAcceptanceTest {

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

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private String hospitalToken;
    private String donorAToken;
    private String donorBToken;
    private Long bloodRequestId;

    @BeforeEach
    void setUp() throws Exception {
        matchRepository.deleteAll();
        requestRepository.deleteAll();
        donorRepository.deleteAll();
        hospitalRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Hospital Setup (MG Road: Lat 12.9716, Lon 77.5946)
        hospitalToken = registerUserAndGetToken("Apex Hospital Staff", "apex@lifelink.org", "+918011223344", Role.HOSPITAL);
        User hospUser = userRepository.findByEmail("apex@lifelink.org").orElseThrow();
        Hospital hospital = Hospital.builder()
                .user(hospUser)
                .hospitalName("Apex Emergency Hospital")
                .address("MG Road, Bangalore")
                .emergencyPhone("+918011223399")
                .licenseNumber("HOSP-APEX-01")
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.5946, 12.9716)))
                .verified(true)
                .build();
        hospitalRepository.save(hospital);

        // 2. Create Blood Request: 1 Unit of O+ RBC, initial radius 5.0 km
        BloodRequest req = BloodRequest.builder()
                .hospital(hospital)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .componentType(ComponentType.RBC)
                .unitsRequired(1) // Only 1 unit needed!
                .unitsFulfilled(0)
                .urgency(Urgency.CRITICAL)
                .initialRadius(5.0)
                .currentRadius(5.0)
                .requiredBy(LocalDateTime.now().plusHours(2))
                .status(RequestStatus.OPEN)
                .build();
        BloodRequest saved = requestRepository.save(req);
        bloodRequestId = saved.getId();

        // 3. Register Donor A (within Tier 1: ~2.5 km away)
        donorAToken = registerUserAndGetToken("Donor A", "donorA.escl@lifelink.org", "+919900000001", Role.DONOR);
        createDonorProfile("donorA.escl@lifelink.org", BloodGroup.O_POSITIVE, ComponentType.RBC, 77.6150, 12.9716);

        // 4. Register Donor B (within Tier 2: ~8.0 km away - outside initial 5 km radius)
        donorBToken = registerUserAndGetToken("Donor B", "donorB.escl@lifelink.org", "+919900000002", Role.DONOR);
        createDonorProfile("donorB.escl@lifelink.org", BloodGroup.O_POSITIVE, ComponentType.RBC, 77.6700, 12.9716);
    }

    private String registerUserAndGetToken(String name, String email, String phone, Role role) throws Exception {
        RegisterRequest reg = RegisterRequest.builder()
                .name(name)
                .email(email)
                .password("password123")
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

    private void createDonorProfile(String email, BloodGroup bg, ComponentType comp, double lon, double lat) {
        User user = userRepository.findByEmail(email.toLowerCase()).orElseThrow();
        Donor donor = Donor.builder()
                .user(user)
                .bloodGroup(bg)
                .componentType(comp)
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(lon, lat)))
                .lastDonationDate(LocalDate.now().minusDays(80))
                .available(true)
                .eligible(true)
                .build();
        donorRepository.save(donor);
    }

    @Test
    @DisplayName("Radius Escalation: Expands search radius from 5 km to 10 km and matches wider-radius donors")
    void testRadiusEscalation() throws Exception {
        // Initial Tier 1 matching: Only Donor A (~2.5 km) is within 5.0 km
        mockMvc.perform(post("/api/matching/requests/" + bloodRequestId + "/find")
                        .header("Authorization", hospitalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].donorName", is("Donor A")));

        // Escalate Request to Tier 2 (Expands radius to 10.0 km)
        mockMvc.perform(post("/api/escalation/requests/" + bloodRequestId + "/escalate")
                        .header("Authorization", hospitalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].donorName", is("Donor B"))); // Donor B (~8.0 km) is now matched!
    }

    @Test
    @DisplayName("Concurrency Control: First donor accepts request successfully; second donor is rejected when slots are fulfilled")
    void testSimultaneousAcceptanceProtection() throws Exception {
        // Match both donors
        mockMvc.perform(post("/api/matching/requests/" + bloodRequestId + "/find")
                        .header("Authorization", hospitalToken));
        mockMvc.perform(post("/api/escalation/requests/" + bloodRequestId + "/escalate")
                        .header("Authorization", hospitalToken));

        // 1. Donor A accepts first -> SUCCESS
        mockMvc.perform(post("/api/matching/requests/" + bloodRequestId + "/accept")
                        .header("Authorization", donorAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.requestStatus", is("MATCHED")))
                .andExpect(jsonPath("$.unitsFulfilled", is(1)));

        // 2. Donor B attempts to accept already fulfilled request -> REJECTED
        mockMvc.perform(post("/api/matching/requests/" + bloodRequestId + "/accept")
                        .header("Authorization", donorBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("already been fulfilled")));
    }
}
