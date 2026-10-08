package com.lifelink.hospital;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    Optional<Hospital> findByUserId(Long userId);

    Optional<Hospital> findByUserEmail(String email);

    List<Hospital> findByVerifiedTrue();

    boolean existsByLicenseNumber(String licenseNumber);
}
