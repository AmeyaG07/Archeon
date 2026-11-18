package com.webui.backend.controller;

import com.webui.backend.model.ManifestoEntity;
import com.webui.backend.repository.ManifestoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manifesto")
public class ManifestoController {

    @Autowired
    private ManifestoRepository manifestoRepository;

    @GetMapping
    public ResponseEntity<ManifestoEntity> getManifesto() {
        return manifestoRepository.findAll().stream().findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public ManifestoEntity updateManifesto(@RequestBody ManifestoEntity updated) {
        return manifestoRepository.findAll().stream().findFirst().map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setHeadline(updated.getHeadline());
            existing.setParagraphsJson(updated.getParagraphsJson());
            return manifestoRepository.save(existing);
        }).orElseGet(() -> manifestoRepository.save(updated));
    }
}
