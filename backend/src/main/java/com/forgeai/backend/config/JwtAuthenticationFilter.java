package com.forgeai.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            JwtUtil.JwtClaims claims = JwtUtil.validateTokenAndGetClaims(token);

            if (claims != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String role = claims.getRole();
                String authorityName = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(authorityName);

                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(claims.getEmail(), null, Collections.singletonList(authority));

                SecurityContextHolder.getContext().setAuthentication(authenticationToken);

                // Preserve attributes expected by existing controllers
                request.setAttribute("authenticatedUserId", claims.getUserId());
                request.setAttribute("authenticatedUserRole", role);
                request.setAttribute("authenticatedUserEmail", claims.getEmail());
            }
        }

        filterChain.doFilter(request, response);
    }
}
