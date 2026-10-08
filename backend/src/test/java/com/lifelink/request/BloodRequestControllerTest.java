package com.lifelink.request;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifelink.auth.Role;
import com.lifelink.auth.UserRepository;
import com.lifelink.auth.dto.AuthResponse;
import com.lifelink.auth.dto.RegisterRequest;
import com.lifelink.donor.BloodGroup;
import com.lifelink.donor.ComponentType;
import com.lifelink.hospital.HospitalRepository;
import com.lifelink.hospital.dto.HospitalProfileRequest;
import com.lifelink.request.dto.CreateBloodRequestDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BloodRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BloodRequestRepository bloodRequestRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    private String hospitalToken;

    @BeforeEach
    void setUp() throws Exception {
        bloodRequestRepository.deleteAll();
        hospitalRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register Hospital User
        RegisterRequest hospRegister = RegisterRequest.builder()
                .name("Manipal Hospital Staff")
                .email("manipal@lifelink.org")
                .password("manipalSecret123")
                .phone("+918025556677")
                .role(Role.HOSPITAL)
                .build();

        MvcResult hospResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hospRegister)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse hospAuth = objectMapper.readValue(hospResult.getResponse().getContentAsString(), AuthResponse.class);
        hospitalToken = "Bearer " + hospAuth.getToken();

        // 2. Setup Hospital Profile
        HospitalProfileRequest profileRequest = HospitalProfileRequest.builder()
                .hospitalName("Manipal Hospital")
                .address("Old Airport Road, Bangalore")
                .emergencyPhone("+918025024444")
                .licenseNumber("HOSP-BLR-005")
                .latitude(12.9580)
                .longitude(77.6500)
                .build();

        mockMvc.perform(post("/api/hospitals/profile")
                        .header("Authorization", hospitalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileRequest)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/requests - Successfully creates urgent blood request")
    void testCreateBloodRequestSuccess() throws Exception {
        CreateBloodRequestDto requestDto = CreateBloodRequestDto.builder()
                .bloodGroup(BloodGroup.O_POSITIVE)
                .componentType(ComponentType.RBC)
                .unitsRequired(2)
                .urgency(Urgency.CRITICAL)
                .requiredBy(LocalDateTime.now().plusHours(4))
                .initialRadius(5.0)
                .notes("Emergency surgery patient in ICU")
                .build();

        mockMvc.perform(post("/api/requests")
                        .header("Authorization", hospitalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.bloodGroup", is("O_POSITIVE")))
                .andExpect(jsonPath("$.componentType", is("RBC")))
                .andExpect(jsonPath("$.unitsRequired", is(2)))
                .andExpect(jsonPath("$.unitsFulfilled", is(0)))
                .andExpect(jsonPath("$.urgency", is("CRITICAL")))
                .andExpect(jsonPath("$.status", is("OPEN")))
                .andExpect(jsonPath("$.hospitalName", is("Manipal Hospital")));
    }

    @Test
    @DisplayName("GET /api/requests/hospital/my - Returns all requests posted by current hospital")
    void testGetMyHospitalRequestsSuccess() throws Exception {
        CreateBloodRequestDto requestDto = CreateBloodRequestDto.builder()
                .bloodGroup(BloodGroup.A_NEGATIVE)
                .componentType(ComponentType.WHOLE_BLOOD)
                .unitsRequired(1)
                .urgency(Urgency.URGENT)
                .requiredBy(LocalDateTime.now().plusHours(6))
                .build();

        mockMvc.perform(post("/api/requests")
                        .header("Authorization", hospitalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/requests/hospital/my")
                        .header("Authorization", hospitalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].bloodGroup", is("A_NEGATIVE")));
    }

    @Test
    @DisplayName("PATCH /api/requests/{id}/cancel - Hospital successfully cancels an open request")
    void testCancelBloodRequestSuccess() throws Exception {
        CreateBloodRequestDto requestDto = CreateBloodRequestDto.builder()
                .bloodGroup(BloodGroup.B_POSITIVE)
                .componentType(ComponentType.PLASMA)
                .unitsRequired(3)
                .urgency(Urgency.STANDARD)
                .requiredBy(LocalDateTime.now().plusDays(1))
                .build();

        MvcResult result = mockMvc.perform(post("/api/requests")
                        .header("Authorization", hospitalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andReturn();

        Long requestId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(patch("/api/requests/" + requestId + "/cancel")
                        .header("Authorization", hospitalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));
    }

    @Test
    @DisplayName("POST /api/requests - Rejects blood request with past requiredBy date")
    void testCreateBloodRequestPastDateFails() throws Exception {
        CreateBloodRequestDto requestDto = CreateBloodRequestDto.builder()
                .bloodGroup(BloodGroup.AB_POSITIVE)
                .componentType(ComponentType.PLATELETS)
                .unitsRequired(1)
                .urgency(Urgency.CRITICAL)
                .requiredBy(LocalDateTime.now().minusHours(1)) // Past timestamp!
                .build();

        mockMvc.perform(post("/api/requests")
                        .header("Authorization", hospitalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.fieldErrors.requiredBy", notNullValue()));
    }
}
