package com.webui.backend.repository;

import com.webui.backend.model.AutomationSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AutomationSettingsRepository extends JpaRepository<AutomationSettingsEntity, Long> {
    Optional<AutomationSettingsEntity> findFirstByOrderByIdAsc();
}
