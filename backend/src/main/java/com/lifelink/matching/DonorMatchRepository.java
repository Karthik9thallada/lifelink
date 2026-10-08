package com.lifelink.matching;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DonorMatchRepository extends JpaRepository<DonorMatch, Long> {

    List<DonorMatch> findByRequestIdOrderByDistanceAsc(Long requestId);

    List<DonorMatch> findByDonorIdOrderByNotifiedAtDesc(Long donorId);

    Optional<DonorMatch> findByRequestIdAndDonorId(Long requestId, Long donorId);

    List<DonorMatch> findByRequestIdAndStatus(Long requestId, MatchStatus status);

    List<DonorMatch> findByDonorIdAndStatus(Long donorId, MatchStatus status);

    int countByRequestId(Long requestId);

    boolean existsByRequestIdAndDonorId(Long requestId, Long donorId);
}
