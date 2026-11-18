package com.webui.backend.controller;

import com.webui.backend.model.ProjectEntity;
import com.webui.backend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping
    public List<ProjectEntity> getAllProjects() {
        return projectRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectEntity> getProjectById(@PathVariable String id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ProjectEntity createProject(@RequestBody ProjectEntity project) {
        return projectRepository.save(project);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectEntity> updateProject(@PathVariable String id, @RequestBody ProjectEntity updated) {
        return projectRepository.findById(id).map(existing -> {
            existing.setCode(updated.getCode());
            existing.setTitle(updated.getTitle());
            existing.setReleaseDate(updated.getReleaseDate());
            existing.setTemperature(updated.getTemperature());
            existing.setSummaryTitle(updated.getSummaryTitle());
            existing.setSummary(updated.getSummary());
            existing.setTagsJson(updated.getTagsJson());
            existing.setLinksJson(updated.getLinksJson());
            existing.setSocialsJson(updated.getSocialsJson());
            existing.setAccentColor(updated.getAccentColor());
            return ResponseEntity.ok(projectRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable String id) {
        if (projectRepository.existsById(id)) {
            projectRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
