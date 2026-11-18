package com.webui.backend.repository;

import com.webui.backend.model.LeadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeadRepository extends JpaRepository<LeadEntity, UUID> {
    List<LeadEntity> findAllByOrderByCreatedAtDesc();
    List<LeadEntity> findByServiceDisciplineOrderByCreatedAtDesc(String serviceDiscipline);
}
