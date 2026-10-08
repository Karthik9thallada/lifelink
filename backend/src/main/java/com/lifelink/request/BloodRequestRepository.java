package com.lifelink.request;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    List<BloodRequest> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);

    List<BloodRequest> findByHospitalUserEmailOrderByCreatedAtDesc(String email);

    List<BloodRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    List<BloodRequest> findByStatusInOrderByCreatedAtDesc(Collection<RequestStatus> statuses);
}
