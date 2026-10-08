package com.lifelink.notification;

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
import com.lifelink.matching.AcceptanceService;
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
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@AutoConfigureMockMvc
class WebSocketNotificationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

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

    private Hospital hospital;
    private Donor donor;
    private BloodRequest bloodRequest;

    @BeforeEach
    void setUp() {
        matchRepository.deleteAll();
        requestRepository.deleteAll();
        donorRepository.deleteAll();
        hospitalRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Hospital User & Hospital
        User hospUser = userRepository.save(User.builder()
                .name("St. John Medical")
                .email("stjohns@lifelink.org")
                .password("hash123")
                .phone("+918012345678")
                .role(Role.HOSPITAL)
                .build());

        hospital = hospitalRepository.save(Hospital.builder()
                .user(hospUser)
                .hospitalName("St. John's Emergency Care")
                .address("Koramangala, Bangalore")
                .emergencyPhone("+918099887766")
                .licenseNumber("HOSP-STJ-01")
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.6200, 12.9350)))
                .verified(true)
                .build());

        // 2. Donor User & Donor
        User donorUser = userRepository.save(User.builder()
                .name("Kavita Sharma")
                .email("kavita@lifelink.org")
                .password("hash123")
                .phone("+919876543210")
                .role(Role.DONOR)
                .build());

        donor = donorRepository.save(Donor.builder()
                .user(donorUser)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .componentType(ComponentType.RBC)
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(77.6250, 12.9370))) // ~0.6 km away
                .lastDonationDate(LocalDate.now().minusDays(90))
                .available(true)
                .eligible(true)
                .build());

        // 3. Request
        bloodRequest = requestRepository.save(BloodRequest.builder()
                .hospital(hospital)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .componentType(ComponentType.RBC)
                .unitsRequired(1)
                .unitsFulfilled(0)
                .urgency(Urgency.CRITICAL)
                .initialRadius(5.0)
                .currentRadius(5.0)
                .requiredBy(LocalDateTime.now().plusHours(2))
                .status(RequestStatus.OPEN)
                .build());
    }

    @Test
    @DisplayName("WebSocket Broadcast: Matches trigger notifications to both donor channel and request live topic")
    void testMatchingDispatchesWebSocketNotifications() {
        reset(messagingTemplate);

        matchingService.findAndMatchDonors(bloodRequest.getId());

        // Verify donor received private alert on /topic/donors/{donorId}
        ArgumentCaptor<LiveUpdateMessage> donorMsgCaptor = ArgumentCaptor.forClass(LiveUpdateMessage.class);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/donors/" + donor.getId()), donorMsgCaptor.capture());
        LiveUpdateMessage donorMsg = donorMsgCaptor.getValue();
        assertEquals("EMERGENCY_MATCH", donorMsg.getType());
        assertEquals(bloodRequest.getId(), donorMsg.getRequestId());
        assertTrue(donorMsg.getMessage().contains("St. John's Emergency Care"));

        // Verify hospital request live console received notification on /topic/requests/{requestId}
        ArgumentCaptor<LiveUpdateMessage> reqMsgCaptor = ArgumentCaptor.forClass(LiveUpdateMessage.class);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/requests/" + bloodRequest.getId()), reqMsgCaptor.capture());
        LiveUpdateMessage reqMsg = reqMsgCaptor.getValue();
        assertEquals("MATCHES_FOUND", reqMsg.getType());
    }

    @Test
    @DisplayName("WebSocket Broadcast: Radius escalation and donor acceptance broadcast live updates")
    void testEscalationAndAcceptanceWebSocketNotifications() {
        // Find match first
        matchingService.findAndMatchDonors(bloodRequest.getId());
        reset(messagingTemplate);

        // 1. Escalate request
        escalationService.escalateRequest(bloodRequest.getId());

        verify(messagingTemplate).convertAndSend(
                eq("/topic/requests/" + bloodRequest.getId()),
                argThat((LiveUpdateMessage msg) ->
                        "RADIUS_ESCALATED".equals(msg.getType()) && Double.valueOf(10.0).equals(msg.getData()))
        );

        reset(messagingTemplate);

        // 2. Donor accepts
        acceptanceService.acceptRequest(bloodRequest.getId(), "kavita@lifelink.org");

        verify(messagingTemplate).convertAndSend(
                eq("/topic/requests/" + bloodRequest.getId()),
                argThat((LiveUpdateMessage msg) ->
                        "DONOR_ACCEPTED".equals(msg.getType()) && msg.getMessage().contains("Kavita Sharma"))
        );
    }
}
