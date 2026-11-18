package com.webui.backend.repository;

import com.webui.backend.model.ManifestoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ManifestoRepository extends JpaRepository<ManifestoEntity, Long> {
}
