package com.lifelink.donor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DonorRepository extends JpaRepository<Donor, Long> {

    Optional<Donor> findByUserId(Long userId);

    Optional<Donor> findByUserEmail(String email);

    boolean existsByUserId(Long userId);

    List<Donor> findByAvailableTrueAndEligibleTrue();

    List<Donor> findByBloodGroupAndAvailableTrue(BloodGroup bloodGroup);
}
