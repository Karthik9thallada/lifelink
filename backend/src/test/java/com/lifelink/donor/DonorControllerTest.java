package com.lifelink.donor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifelink.auth.Role;
import com.lifelink.auth.UserRepository;
import com.lifelink.auth.dto.AuthResponse;
import com.lifelink.auth.dto.RegisterRequest;
import com.lifelink.donor.dto.DonorProfileRequest;
import com.lifelink.donor.dto.UpdateAvailabilityRequest;
import com.lifelink.donor.dto.UpdateLocationRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DonorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private UserRepository userRepository;

    private String donorToken;

    @BeforeEach
    void setUp() throws Exception {
        donorRepository.deleteAll();
        userRepository.deleteAll();

        // Register a test donor to get a JWT
        RegisterRequest register = RegisterRequest.builder()
                .name("Arjun Patel")
                .email("arjun.donor@lifelink.org")
                .password("donorSecret123")
                .phone("+919811122233")
                .role(Role.DONOR)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
        donorToken = "Bearer " + authResponse.getToken();
    }

    @Test
    @DisplayName("POST /api/donors/profile - Successfully creates donor profile with PostGIS location")
    void testCreateDonorProfileSuccess() throws Exception {
        DonorProfileRequest request = DonorProfileRequest.builder()
                .bloodGroup(BloodGroup.O_POSITIVE)
                .componentType(ComponentType.RBC)
                .latitude(12.9716)
                .longitude(77.5946)
                .lastDonationDate(LocalDate.now().minusDays(90))
                .available(true)
                .build();

        mockMvc.perform(post("/api/donors/profile")
                        .header("Authorization", donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.bloodGroup", is("O_POSITIVE")))
                .andExpect(jsonPath("$.componentType", is("RBC")))
                .andExpect(jsonPath("$.available", is(true)))
                .andExpect(jsonPath("$.eligible", is(true)))
                .andExpect(jsonPath("$.latitude", is(12.9716)))
                .andExpect(jsonPath("$.longitude", is(77.5946)));
    }

    @Test
    @DisplayName("PATCH /api/donors/availability - Successfully toggles donor live availability")
    void testToggleAvailabilitySuccess() throws Exception {
        // Create initial profile
        DonorProfileRequest profileRequest = DonorProfileRequest.builder()
                .bloodGroup(BloodGroup.A_POSITIVE)
                .componentType(ComponentType.WHOLE_BLOOD)
                .latitude(12.9716)
                .longitude(77.5946)
                .available(true)
                .build();

        mockMvc.perform(post("/api/donors/profile")
                        .header("Authorization", donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileRequest)))
                .andExpect(status().isCreated());

        // Toggle to FALSE
        UpdateAvailabilityRequest turnOff = UpdateAvailabilityRequest.builder()
                .available(false)
                .build();

        mockMvc.perform(patch("/api/donors/availability")
                        .header("Authorization", donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(turnOff)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available", is(false)));

        // Toggle back to TRUE
        UpdateAvailabilityRequest turnOn = UpdateAvailabilityRequest.builder()
                .available(true)
                .build();

        mockMvc.perform(patch("/api/donors/availability")
                        .header("Authorization", donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(turnOn)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available", is(true)));
    }

    @Test
    @DisplayName("PATCH /api/donors/location - Successfully updates donor live GPS location")
    void testUpdateLocationSuccess() throws Exception {
        DonorProfileRequest profileRequest = DonorProfileRequest.builder()
                .bloodGroup(BloodGroup.B_POSITIVE)
                .componentType(ComponentType.PLASMA)
                .latitude(12.9716)
                .longitude(77.5946)
                .available(true)
                .build();

        mockMvc.perform(post("/api/donors/profile")
                        .header("Authorization", donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileRequest)))
                .andExpect(status().isCreated());

        UpdateLocationRequest newLocation = UpdateLocationRequest.builder()
                .latitude(13.0827)
                .longitude(80.2707)
                .build();

        mockMvc.perform(patch("/api/donors/location")
                        .header("Authorization", donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLocation)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.latitude", is(13.0827)))
                .andExpect(jsonPath("$.longitude", is(80.2707)));
    }

    @Test
    @DisplayName("GET /api/donors/me - Rejects unauthorized requests without JWT token")
    void testAccessWithoutTokenForbidden() throws Exception {
        mockMvc.perform(get("/api/donors/me"))
                .andExpect(status().isForbidden());
    }
}
