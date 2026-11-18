package com.webui.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI archeonOpenAPI() {
        final String securitySchemeName = "BearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("ArcheOn Design Studio — REST API Specification")
                        .description("Official backend API contract for ArcheOn Design Studio (MB's ArcheOn Design Studio). " +
                                "Covers Public Website, Lead Intake, Client Portal, Vendor Portal, Maker-Checker Approvals, " +
                                "Two-Party Cash Settlement Protocol, and Financial Ledger Operations.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("MB's ArcheOn Design Studio / Engineering")
                                .email("contact@archeon-ds.com")
                                .url("https://maps.app.goo.gl/wLidaC62gQLccoNY8"))
                        .license(new License().name("Proprietary - ArcheOn Design Studio")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development Backend Server")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT Bearer token obtained from /api/auth/login")));
    }
}
