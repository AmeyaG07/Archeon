package com.webui.backend.config;

import com.webui.backend.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" +
                                    (authException.getMessage() != null ? authException.getMessage().replace("\"", "\\\"") : "Authentication required") +
                                    "\",\"status\":401}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json");
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write("{\"error\":\"Forbidden\",\"message\":\"" +
                                    (accessDeniedException.getMessage() != null ? accessDeniedException.getMessage().replace("\"", "\\\"") : "Access denied") +
                                    "\",\"status\":403}");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // 1. Explicitly Public Read & Auth Endpoints
                        .requestMatchers("/api/auth/login", "/api/auth/refresh", "/error").permitAll()
                        .requestMatchers("/api/auth/logout", "/api/auth/logout-all", "/api/auth/sessions/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/invitations/accept").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/invitations/validate").permitAll()
                        .requestMatchers("/api/users/me", "/api/users/change-password").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/projects/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/manifesto/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/approvals/config").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/leads").permitAll()
                        .requestMatchers("/api/webhooks/**").permitAll()
                        .requestMatchers("/api/site-updates/**").authenticated()
                        .requestMatchers("/api/vendor-payment-methods/**").authenticated()
                        .requestMatchers("/api/billing/**").authenticated()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                        // 2. Protected Identity Domain (Users, Clients, Vendors, Invitations)
                        // A. User Administration (Admin Only)
                        .requestMatchers(HttpMethod.GET, "/api/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/*/role").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/users/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/users/*").authenticated()

                        // B. Client Management & Self-Service
                        .requestMatchers(HttpMethod.GET, "/api/clients/me").hasRole("CLIENT")
                        .requestMatchers(HttpMethod.PUT, "/api/clients/me").hasRole("CLIENT")
                        .requestMatchers(HttpMethod.GET, "/api/clients", "/api/clients/").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.POST, "/api/clients", "/api/clients/").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.PATCH, "/api/clients/*/status").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.POST, "/api/clients/*/invite").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.GET, "/api/clients/**").hasAnyRole("ADMIN", "STAFF", "CLIENT")
                        .requestMatchers(HttpMethod.PUT, "/api/clients/**").hasAnyRole("ADMIN", "STAFF", "CLIENT")

                        // C. Vendor Management & Self-Service
                        .requestMatchers(HttpMethod.GET, "/api/vendors/me").hasRole("VENDOR")
                        .requestMatchers(HttpMethod.PUT, "/api/vendors/me").hasRole("VENDOR")
                        .requestMatchers(HttpMethod.GET, "/api/vendors", "/api/vendors/").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.POST, "/api/vendors", "/api/vendors/").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.PATCH, "/api/vendors/*/status").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.POST, "/api/vendors/*/invite").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.GET, "/api/vendors/**").hasAnyRole("ADMIN", "STAFF", "VENDOR")
                        .requestMatchers(HttpMethod.PUT, "/api/vendors/**").hasAnyRole("ADMIN", "STAFF", "VENDOR")

                        // D. User Invitations Management
                        .requestMatchers("/api/invitations/**").hasAnyRole("ADMIN", "STAFF")

                        // E. Operational Project Management (Phase 4.2)
                        .requestMatchers(HttpMethod.POST, "/api/operational-projects", "/api/operational-projects/").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.PUT, "/api/operational-projects/*").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.PATCH, "/api/operational-projects/*/status").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.POST, "/api/operational-projects/*/archive").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.POST, "/api/operational-projects/*/vendors").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.PATCH, "/api/operational-projects/*/vendors/*/status").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.POST, "/api/operational-projects/*/phases").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.PUT, "/api/operational-projects/*/phases/*").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.PATCH, "/api/operational-projects/*/phases/*/status").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.POST, "/api/operational-projects/*/milestones").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.PUT, "/api/operational-projects/*/milestones/*").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.PATCH, "/api/operational-projects/*/milestones/*/status").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.POST, "/api/operational-projects/*/tasks").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.PUT, "/api/operational-projects/*/tasks/*").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.PATCH, "/api/operational-projects/*/tasks/*/status").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT", "VENDOR")
                        .requestMatchers(HttpMethod.GET, "/api/operational-projects/**").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT", "CLIENT", "VENDOR")

                        // F. Document Management System (Phase 4.3)
                        .requestMatchers(HttpMethod.POST, "/api/documents/upload").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT", "CLIENT", "VENDOR")
                        .requestMatchers(HttpMethod.POST, "/api/documents/*/versions").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT", "CLIENT", "VENDOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/documents/*/classification").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.POST, "/api/documents/*/permissions").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.DELETE, "/api/documents/*/permissions/*").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.POST, "/api/documents/*/archive").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.POST, "/api/documents/*/restore").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.POST, "/api/documents/*/release-quarantine").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/documents/*/audit").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT")
                        .requestMatchers(HttpMethod.GET, "/api/documents/**").hasAnyRole("ADMIN", "STAFF", "PROJECT_MANAGER", "PRINCIPAL_ARCHITECT", "FINANCE_MANAGER", "FINANCE_MAKER", "FINANCE_CHECKER", "FINANCE_AUDIT", "CLIENT", "VENDOR")

                        // G. Client GST Invoicing & Line Items (Phase 5.1)
                        .requestMatchers(HttpMethod.POST, "/api/invoices", "/api/invoices/").hasAnyRole("ADMIN", "FINANCE_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/invoices/*/payments").hasAnyRole("ADMIN", "FINANCE_MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/invoices/**").hasAnyRole("ADMIN", "FINANCE_MANAGER", "STAFF", "CLIENT")

                        // H. In-App Notifications (Phase 5.1)
                        .requestMatchers("/api/notifications/**").authenticated()

                        // I. Dashboards (Phase 5.1)
                        .requestMatchers("/api/dashboards/admin").hasAnyRole("ADMIN", "FINANCE_MANAGER", "STAFF")
                        .requestMatchers("/api/dashboards/client").hasRole("CLIENT")
                        .requestMatchers("/api/dashboards/vendor").hasRole("VENDOR")
                        .requestMatchers("/api/dashboards/**").authenticated()

                        // J. Global Administrative Audit Center (Phase 5.1)
                        .requestMatchers("/api/admin/audit/**").hasAnyRole("ADMIN", "FINANCE_MANAGER")
                        .requestMatchers("/api/settings/**").hasAnyRole("ADMIN", "STAFF")

                        // 3. Protected Leads (Studio Staff / Admin only)
                        .requestMatchers(HttpMethod.GET, "/api/leads").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.PATCH, "/api/leads/**").hasAnyRole("ADMIN", "STAFF")

                        // 3. Protected Bill Approvals (Maker-Checker / Finance / Admin / Vendor)
                        .requestMatchers(HttpMethod.POST, "/api/approvals/initiate").hasAnyRole("ADMIN", "FINANCE_MAKER", "STAFF", "VENDOR")
                        .requestMatchers(HttpMethod.POST, "/api/approvals/*/approve-primary").hasAnyRole("ADMIN", "FINANCE_CHECKER", "FINANCE_CHECKER_1")
                        .requestMatchers(HttpMethod.POST, "/api/approvals/*/approve-secondary").hasAnyRole("ADMIN", "FINANCE_CHECKER_2", "FINANCE_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/approvals/*/reject").hasAnyRole("ADMIN", "FINANCE_CHECKER", "FINANCE_MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/approvals/**").hasAnyRole("ADMIN", "FINANCE_MAKER", "FINANCE_CHECKER", "FINANCE_MANAGER", "STAFF", "VENDOR")

                        // 4. Protected Financial Operations (Role-Separated)
                        // A. Specific Cash Register Rules (Internal Only for GET /cash/**, Scoped for my-settlements)
                        .requestMatchers(HttpMethod.GET, "/api/finance/cash/my-settlements").hasAnyRole("ADMIN", "VENDOR", "CLIENT", "STAFF")
                        .requestMatchers(HttpMethod.GET, "/api/finance/cash/**").hasAnyRole("ADMIN", "FINANCE_MANAGER", "STAFF", "SITE_SUPERVISOR")
                        .requestMatchers(HttpMethod.POST, "/api/finance/cash/initiate").hasAnyRole("ADMIN", "SITE_SUPERVISOR", "STAFF")
                        .requestMatchers(HttpMethod.POST, "/api/finance/cash/*/respond").hasAnyRole("ADMIN", "VENDOR", "CLIENT")
                        .requestMatchers(HttpMethod.POST, "/api/finance/cash/*/approve").hasAnyRole("ADMIN", "FINANCE_MANAGER")

                        // B. Reports (Finance / Audit / Admin only)
                        .requestMatchers(HttpMethod.GET, "/api/finance/reports/**").hasAnyRole("ADMIN", "FINANCE_MANAGER", "FINANCE_AUDIT", "STAFF")

                        // C. Client & Vendor Permitted Financial Endpoints
                        .requestMatchers(HttpMethod.POST, "/api/finance/payment-proof").hasAnyRole("ADMIN", "CLIENT", "VENDOR", "STAFF")
                        .requestMatchers(HttpMethod.POST, "/api/finance/verify-payment/**").hasAnyRole("ADMIN", "FINANCE_LEAD", "FINANCE_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/finance/dispute").hasAnyRole("ADMIN", "CLIENT", "VENDOR")
                        .requestMatchers(HttpMethod.GET, "/api/finance/bills/**").hasAnyRole("ADMIN", "FINANCE_MANAGER", "STAFF", "CLIENT", "VENDOR")
                        .requestMatchers(HttpMethod.GET, "/api/finance/transactions/**").hasAnyRole("ADMIN", "FINANCE_MANAGER", "STAFF", "CLIENT", "VENDOR")

                        // D. Fallback for any other /api/finance/** GET (Internal only)
                        .requestMatchers(HttpMethod.GET, "/api/finance/**").hasAnyRole("ADMIN", "FINANCE_MANAGER", "STAFF")

                        // 5. Admin Mutation Fallback
                        .requestMatchers(HttpMethod.POST, "/api/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")

                        // 6. Strict Authentication on Any Remaining Request
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
