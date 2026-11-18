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
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: " + authException.getMessage()))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden: " + accessDeniedException.getMessage()))
                )
                .authorizeHttpRequests(auth -> auth
                        // 1. Explicitly Public Read & Auth Endpoints
                        .requestMatchers("/api/auth/login", "/api/auth/refresh").permitAll()
                        .requestMatchers("/api/auth/logout", "/api/auth/logout-all", "/api/auth/sessions/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/projects/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/manifesto/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/approvals/config").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/leads").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                        // 2. Protected Leads (Studio Staff / Admin only)
                        .requestMatchers(HttpMethod.GET, "/api/leads").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.PATCH, "/api/leads/**").hasAnyRole("ADMIN", "STAFF")

                        // 3. Protected Bill Approvals (Maker-Checker / Finance / Admin)
                        .requestMatchers(HttpMethod.POST, "/api/approvals/initiate").hasAnyRole("ADMIN", "FINANCE_MAKER", "STAFF")
                        .requestMatchers(HttpMethod.POST, "/api/approvals/*/approve-primary").hasAnyRole("ADMIN", "FINANCE_CHECKER", "FINANCE_CHECKER_1")
                        .requestMatchers(HttpMethod.POST, "/api/approvals/*/approve-secondary").hasAnyRole("ADMIN", "FINANCE_CHECKER_2", "FINANCE_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/approvals/*/reject").hasAnyRole("ADMIN", "FINANCE_CHECKER", "FINANCE_MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/approvals/**").hasAnyRole("ADMIN", "FINANCE_MAKER", "FINANCE_CHECKER", "FINANCE_MANAGER", "STAFF")

                        // 4. Protected Financial Operations (Role-Separated)
                        // A. Specific Cash Register Rules (Internal Only for GET /cash/**)
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
