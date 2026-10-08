package com.lifelink.request;

import com.lifelink.hospital.Hospital;
import com.lifelink.hospital.HospitalRepository;
import com.lifelink.request.dto.BloodRequestResponse;
import com.lifelink.request.dto.CreateBloodRequestDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;
    private final HospitalRepository hospitalRepository;
    private final com.lifelink.notification.NotificationService notificationService;

    @Transactional
    public BloodRequestResponse createRequest(String userEmail, CreateBloodRequestDto dto) {
        Hospital hospital = hospitalRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Hospital profile not found for user: " + userEmail));

        double initialRadius = dto.getInitialRadius() != null && dto.getInitialRadius() > 0
                ? dto.getInitialRadius()
                : 5.0;

        BloodRequest request = BloodRequest.builder()
                .hospital(hospital)
                .bloodGroup(dto.getBloodGroup())
                .componentType(dto.getComponentType())
                .unitsRequired(dto.getUnitsRequired())
                .unitsFulfilled(0)
                .urgency(dto.getUrgency())
                .initialRadius(initialRadius)
                .currentRadius(initialRadius)
                .requiredBy(dto.getRequiredBy())
                .status(RequestStatus.OPEN)
                .notes(dto.getNotes())
                .build();

        BloodRequest saved = bloodRequestRepository.save(request);
        log.info("Created urgent blood request #{} for hospital '{}': {} units of {} ({})",
                saved.getId(), hospital.getHospitalName(), saved.getUnitsRequired(),
                saved.getBloodGroup(), saved.getComponentType());

        BloodRequestResponse response = mapToResponse(saved);
        notificationService.broadcastEmergencyFeed("REQUEST_CREATED", response, "Urgent blood request posted by " + hospital.getHospitalName());

        return response;
    }

    @Transactional(readOnly = true)
    public BloodRequestResponse getRequestById(Long requestId) {
        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Blood request not found with ID: " + requestId));
        return mapToResponse(request);
    }

    @Transactional(readOnly = true)
    public List<BloodRequestResponse> getMyHospitalRequests(String userEmail) {
        return bloodRequestRepository.findByHospitalUserEmailOrderByCreatedAtDesc(userEmail).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public BloodRequestResponse cancelRequest(String userEmail, Long requestId) {
        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Blood request not found with ID: " + requestId));

        if (!request.getHospital().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("You are not authorized to cancel this request");
        }

        if (request.getStatus() == RequestStatus.FULFILLED) {
            throw new IllegalArgumentException("Cannot cancel an already fulfilled request");
        }

        request.setStatus(RequestStatus.CANCELLED);
        BloodRequest saved = bloodRequestRepository.save(request);
        log.info("Cancelled blood request #{} by hospital '{}'", requestId, request.getHospital().getHospitalName());

        notificationService.notifyRequestUpdate(requestId, "REQUEST_CANCELLED", null, "Blood request #" + requestId + " has been cancelled");
        notificationService.broadcastEmergencyFeed("REQUEST_CANCELLED", requestId, "Blood request #" + requestId + " has been cancelled");

        return mapToResponse(saved);
    }

    public BloodRequestResponse mapToResponse(BloodRequest request) {
        Hospital h = request.getHospital();
        Double lat = h.getLocation() != null ? h.getLocation().getY() : null;
        Double lon = h.getLocation() != null ? h.getLocation().getX() : null;

        return BloodRequestResponse.builder()
                .id(request.getId())
                .hospitalId(h.getId())
                .hospitalName(h.getHospitalName())
                .hospitalAddress(h.getAddress())
                .emergencyPhone(h.getEmergencyPhone())
                .bloodGroup(request.getBloodGroup())
                .componentType(request.getComponentType())
                .unitsRequired(request.getUnitsRequired())
                .unitsFulfilled(request.getUnitsFulfilled())
                .urgency(request.getUrgency())
                .initialRadius(request.getInitialRadius())
                .currentRadius(request.getCurrentRadius())
                .requiredBy(request.getRequiredBy())
                .status(request.getStatus())
                .notes(request.getNotes())
                .latitude(lat)
                .longitude(lon)
                .createdAt(request.getCreatedAt())
                .build();
    }
}
