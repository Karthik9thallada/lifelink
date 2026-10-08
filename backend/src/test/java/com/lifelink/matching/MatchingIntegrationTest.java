package com.lifelink.matching;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MatchingIntegrationTest {

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

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private String hospitalToken;
    private Long bloodRequestId;

    @BeforeEach
    void setUp() throws Exception {
        matchRepository.deleteAll();
        requestRepository.deleteAll();
        donorRepository.deleteAll();
        hospitalRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Hospital setup (Central Bangalore: Lat 12.9716, Lon 77.5946)
        RegisterRequest hospReg = RegisterRequest.builder()
                .name("St. Martha Hospital")
                .email("martha@lifelink.org")
                .password("martha123")
                .phone("+918022221100")
                .role(Role.HOSPITAL)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hospReg)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse hospAuth = objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
        hospitalToken = "Bearer " + hospAuth.getToken();

        User hospUser = userRepository.findByEmail("martha@lifelink.org").orElseThrow();
        Hospital hospital = Hospital.builder()
                .user(hospUser)
                .hospitalName("St. Martha Hospital")
                .address("Nrupathunga Road, Bangalore")
                .emergencyPhone("+918022221199")
                .licenseNumber("HOSP-MARTHA-01")
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.5946, 12.9716)))
                .verified(true)
                .build();
        hospitalRepository.save(hospital);

        // 2. Create Blood Request: O_POSITIVE RBC, initial radius 5.0 km
        BloodRequest req = BloodRequest.builder()
                .hospital(hospital)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .componentType(ComponentType.RBC)
                .unitsRequired(2)
                .urgency(Urgency.CRITICAL)
                .initialRadius(5.0)
                .currentRadius(5.0)
                .requiredBy(LocalDateTime.now().plusHours(3))
                .status(RequestStatus.OPEN)
                .build();
        BloodRequest savedReq = requestRepository.save(req);
        bloodRequestId = savedReq.getId();

        // --- Donors Setup ---
        // Donor A: O_NEGATIVE (Universal donor), ~1.2 km away, last donation 90 days ago -> SHOULD MATCH (#1 closest)
        createDonor("donorA@lifelink.org", "+919000000001", "Donor A", BloodGroup.O_NEGATIVE, ComponentType.RBC,
                77.6050, 12.9750, LocalDate.now().minusDays(90), true);

        // Donor B: O_POSITIVE (Identical match), ~3.5 km away, last donation 70 days ago -> SHOULD MATCH (#2)
        createDonor("donorB@lifelink.org", "+919000000002", "Donor B", BloodGroup.O_POSITIVE, ComponentType.RBC,
                77.6200, 12.9600, LocalDate.now().minusDays(70), true);

        // Donor C: B_POSITIVE (Incompatible for O+ RBC), ~1.5 km away -> MUST BE EXCLUDED
        createDonor("donorC@lifelink.org", "+919000000003", "Donor C", BloodGroup.B_POSITIVE, ComponentType.RBC,
                77.6000, 12.9700, LocalDate.now().minusDays(90), true);

        // Donor D: O_POSITIVE (Compatible), ~0.8 km away, but donated only 15 days ago (< 56 days gap) -> MUST BE EXCLUDED (Ineligible)
        createDonor("donorD@lifelink.org", "+919000000004", "Donor D", BloodGroup.O_POSITIVE, ComponentType.RBC,
                77.5980, 12.9690, LocalDate.now().minusDays(15), true);

        // Donor E: O_POSITIVE (Compatible & Eligible), but 15.0 km away (> 5.0 km radius) -> MUST BE EXCLUDED (Outside current radius)
        createDonor("donorE@lifelink.org", "+919000000005", "Donor E", BloodGroup.O_POSITIVE, ComponentType.RBC,
                77.7200, 12.9600, LocalDate.now().minusDays(80), true);
    }

    private void createDonor(String email, String phone, String name, BloodGroup bg, ComponentType comp,
                             double lon, double lat, LocalDate lastDonation, boolean available) {
        User user = User.builder()
                .name(name)
                .email(email)
                .password("$2a$10$hashedpass")
                .phone(phone)
                .role(Role.DONOR)
                .build();
        User savedUser = userRepository.save(user);

        Donor donor = Donor.builder()
                .user(savedUser)
                .bloodGroup(bg)
                .componentType(comp)
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(lon, lat)))
                .lastDonationDate(lastDonation)
                .available(available)
                .eligible(true)
                .build();
        donorRepository.save(donor);
    }

    @Test
    @DisplayName("POST /api/matching/requests/{id}/find - Correctly filters by compatibility, eligibility, and radius, ranking closest donors first")
    void testEndToEndDonorMatching() throws Exception {
        mockMvc.perform(post("/api/matching/requests/" + bloodRequestId + "/find")
                        .header("Authorization", hospitalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2))) // Exactly Donor A and Donor B
                .andExpect(jsonPath("$[0].donorName", is("Donor A"))) // Closest (~1.2 km)
                .andExpect(jsonPath("$[0].bloodGroup", is("O_NEGATIVE")))
                .andExpect(jsonPath("$[0].distanceKm", lessThan(2.0)))
                .andExpect(jsonPath("$[1].donorName", is("Donor B"))) // 2nd closest (~3.5 km)
                .andExpect(jsonPath("$[1].bloodGroup", is("O_POSITIVE")))
                .andExpect(jsonPath("$[1].distanceKm", greaterThan(2.0)));
    }
}
