package com.lifelink.hospital;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifelink.auth.Role;
import com.lifelink.auth.UserRepository;
import com.lifelink.auth.dto.AuthResponse;
import com.lifelink.auth.dto.RegisterRequest;
import com.lifelink.hospital.dto.HospitalProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HospitalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    private String hospitalToken;
    private String donorToken;

    @BeforeEach
    void setUp() throws Exception {
        hospitalRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register Hospital User
        RegisterRequest hospRegister = RegisterRequest.builder()
                .name("City General Staff")
                .email("city.hospital@lifelink.org")
                .password("hospSecret123")
                .phone("+919844455566")
                .role(Role.HOSPITAL)
                .build();

        MvcResult hospResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hospRegister)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse hospAuth = objectMapper.readValue(hospResult.getResponse().getContentAsString(), AuthResponse.class);
        hospitalToken = "Bearer " + hospAuth.getToken();

        // 2. Register Donor User
        RegisterRequest donorRegister = RegisterRequest.builder()
                .name("Rohan Kumar")
                .email("rohan.donor@lifelink.org")
                .password("donorSecret123")
                .phone("+919877788899")
                .role(Role.DONOR)
                .build();

        MvcResult donorResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(donorRegister)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse donorAuth = objectMapper.readValue(donorResult.getResponse().getContentAsString(), AuthResponse.class);
        donorToken = "Bearer " + donorAuth.getToken();
    }

    @Test
    @DisplayName("POST /api/hospitals/profile - Successfully creates hospital profile with PostGIS location")
    void testCreateHospitalProfileSuccess() throws Exception {
        HospitalProfileRequest request = HospitalProfileRequest.builder()
                .hospitalName("City General Hospital")
                .address("100 Feet Ring Road, Bangalore")
                .emergencyPhone("+918022334455")
                .licenseNumber("HOSP-BLR-001")
                .latitude(12.9716)
                .longitude(77.5946)
                .build();

        mockMvc.perform(post("/api/hospitals/profile")
                        .header("Authorization", hospitalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.hospitalName", is("City General Hospital")))
                .andExpect(jsonPath("$.licenseNumber", is("HOSP-BLR-001")))
                .andExpect(jsonPath("$.verified", is(true)))
                .andExpect(jsonPath("$.latitude", is(12.9716)))
                .andExpect(jsonPath("$.longitude", is(77.5946)));
    }

    @Test
    @DisplayName("GET /api/hospitals/me - Returns logged-in hospital's profile")
    void testGetMyHospitalSuccess() throws Exception {
        HospitalProfileRequest request = HospitalProfileRequest.builder()
                .hospitalName("Apollo Emergency Center")
                .address("Bannerghatta Road, Bangalore")
                .emergencyPhone("+918022998877")
                .licenseNumber("HOSP-BLR-002")
                .latitude(12.9100)
                .longitude(77.6000)
                .build();

        mockMvc.perform(post("/api/hospitals/profile")
                        .header("Authorization", hospitalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/hospitals/me")
                        .header("Authorization", hospitalToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hospitalName", is("Apollo Emergency Center")));
    }

    @Test
    @DisplayName("GET /api/hospitals - Publicly accessible list of verified hospitals")
    void testGetAllVerifiedHospitalsPublic() throws Exception {
        HospitalProfileRequest request = HospitalProfileRequest.builder()
                .hospitalName("Fortis Hospital")
                .address("Cunningham Road, Bangalore")
                .emergencyPhone("+918033445566")
                .licenseNumber("HOSP-BLR-003")
                .latitude(12.9800)
                .longitude(77.5900)
                .build();

        mockMvc.perform(post("/api/hospitals/profile")
                        .header("Authorization", hospitalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Perform request WITHOUT any Authorization header
        mockMvc.perform(get("/api/hospitals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/hospitals/profile - Rejects requests from DONOR role with 403 Forbidden")
    void testAccessHospitalApiWithDonorTokenForbidden() throws Exception {
        HospitalProfileRequest request = HospitalProfileRequest.builder()
                .hospitalName("Unauthorized Clinic")
                .address("Some Road")
                .emergencyPhone("+918000000000")
                .licenseNumber("HOSP-ERR-001")
                .latitude(12.9700)
                .longitude(77.5900)
                .build();

        mockMvc.perform(post("/api/hospitals/profile")
                        .header("Authorization", donorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
