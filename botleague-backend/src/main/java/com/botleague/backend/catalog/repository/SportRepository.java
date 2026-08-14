package com.botleague.backend.catalog.repository;

import com.botleague.backend.catalog.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SportRepository extends JpaRepository<Sport, UUID> {

    Optional<Sport> findBySlug(String slug);

    List<Sport> findByStatusOrderByDisplayOrderAsc(String status);

    List<Sport> findAllByOrderByDisplayOrderAsc();

    boolean existsBySlug(String slug);
}
