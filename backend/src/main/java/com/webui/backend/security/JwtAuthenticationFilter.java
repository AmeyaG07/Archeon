package com.webui.backend.security;

import com.webui.backend.model.UserEntity;
import com.webui.backend.repository.UserRepository;
import com.webui.backend.service.TokenRevocationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private TokenRevocationService tokenRevocationService;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String jwt = getJwtFromRequest(request);

        if (StringUtils.hasText(jwt)) {
            try {
                // 1. Mandatory JWT Validation (Signature, Expiration, Issuer, Audience)
                if (!tokenProvider.validateToken(jwt)) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Invalid, malformed or expired JWT token");
                    return;
                }

                String jti = tokenProvider.getJtiFromJwt(jwt);
                String fid = tokenProvider.getFamilyIdFromJwt(jwt);
                String username = tokenProvider.getUsernameFromJwt(jwt);
                Date issuedAt = tokenProvider.getIssuedAtFromJwt(jwt);
                Long tokenVersion = tokenProvider.getTokenVersionFromJwt(jwt);
                String role = tokenProvider.getRoleFromJwt(jwt);

                if (!StringUtils.hasText(username)) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Missing subject in JWT token");
                    return;
                }

                // 2. JTI-level Revocation Check
                if (jti != null && tokenRevocationService.isTokenRevoked(jti)) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Token has been revoked");
                    return;
                }

                // 3. P3-07: Session Family-level Revocation Check (Immediate Access Token Invalidation)
                if (fid != null && tokenRevocationService.isFamilyRevoked(fid)) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Session family has been revoked");
                    return;
                }

                // 4. User Account-level Invalidation Timestamp Check
                if (tokenRevocationService.isUserRevoked(username, issuedAt)) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: User session has been revoked");
                    return;
                }

                // 5. P3-03: Strict Database User Validation (Reject Deleted or Nonexistent Users)
                Optional<UserEntity> userOpt = userRepository.findByUsername(username);
                if (userOpt.isEmpty()) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: User account does not exist or has been deleted");
                    return;
                }

                UserEntity user = userOpt.get();

                // Account disablement check
                if (!user.isEnabled()) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Account is disabled");
                    return;
                }

                // Token version invalidation check
                if (user.getTokenVersion() != null && tokenVersion != null && tokenVersion < user.getTokenVersion()) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Token version superseded");
                    return;
                }

                // Role demotion check
                if (user.getRole() != null && role != null) {
                    String normTokenRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                    String normUserRole = user.getRole().startsWith("ROLE_") ? user.getRole() : "ROLE_" + user.getRole();
                    if (!normTokenRole.equals(normUserRole)) {
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: User role has changed or demoted");
                        return;
                    }
                }

                // 6. Populate SecurityContextHolder with validated principal and roles
                List<SimpleGrantedAuthority> authorities;
                if (StringUtils.hasText(role)) {
                    String authName = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                    authorities = Collections.singletonList(new SimpleGrantedAuthority(authName));
                } else {
                    authorities = Collections.emptyList();
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        username, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (TokenRevocationUnavailableException ex) {
                // FAIL CLOSED: Revocation service / Redis failure must strictly reject authentication
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Revocation service unavailable");
                return;
            } catch (Exception ex) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: Authentication verification error: " + ex.getMessage());
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
