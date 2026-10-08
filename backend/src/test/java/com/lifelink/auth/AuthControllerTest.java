package com.lifelink.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifelink.auth.dto.LoginRequest;
import com.lifelink.auth.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/auth/register - Successfully registers a DONOR with hashed password and returns JWT")
    void testRegisterDonorSuccess() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Rahul Sharma")
                .email("rahul@lifelink.org")
                .password("password123")
                .phone("+919876543210")
                .role(Role.DONOR)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.email", is("rahul@lifelink.org")))
                .andExpect(jsonPath("$.role", is("DONOR")))
                .andExpect(jsonPath("$.name", is("Rahul Sharma")));
    }

    @Test
    @DisplayName("POST /api/auth/register - Rejects registration when email already exists")
    void testRegisterDuplicateEmailFails() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("First User")
                .email("duplicate@lifelink.org")
                .password("password123")
                .phone("+919876543211")
                .role(Role.DONOR)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        RegisterRequest duplicate = RegisterRequest.builder()
                .name("Second User")
                .email("duplicate@lifelink.org")
                .password("password456")
                .phone("+919876543212")
                .role(Role.DONOR)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message", containsString("already registered")));
    }

    @Test
    @DisplayName("POST /api/auth/login - Authenticates valid credentials and issues JWT")
    void testLoginSuccess() throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .name("Priya Patel")
                .email("priya@lifelink.org")
                .password("secretPass99")
                .phone("+919876543220")
                .role(Role.HOSPITAL)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        LoginRequest login = LoginRequest.builder()
                .email("priya@lifelink.org")
                .password("secretPass99")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.email", is("priya@lifelink.org")))
                .andExpect(jsonPath("$.role", is("HOSPITAL")));
    }

    @Test
    @DisplayName("POST /api/auth/login - Rejects incorrect password with 401 Unauthorized")
    void testLoginWrongPasswordFails() throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .name("Vikram Singh")
                .email("vikram@lifelink.org")
                .password("correctPassword")
                .phone("+919876543230")
                .role(Role.DONOR)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        LoginRequest login = LoginRequest.builder()
                .email("vikram@lifelink.org")
                .password("wrongPassword")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }
}
