package com.pfa.helpdesk.service;

import com.pfa.helpdesk.dto.request.LoginRequest;
import com.pfa.helpdesk.dto.request.RegisterRequest;
import com.pfa.helpdesk.dto.response.AuthResponse;
import com.pfa.helpdesk.dto.response.UserResponse;
import com.pfa.helpdesk.entity.User;
import com.pfa.helpdesk.entity.enums.Role;
import com.pfa.helpdesk.repository.UserRepository;
import com.pfa.helpdesk.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        User user = (User) authentication.getPrincipal();
        String jwt = tokenProvider.generateToken(user);
        
        return AuthResponse.builder()
                .token(jwt)
                .user(mapToUserResponse(user))
                .build();
    }

    @Transactional
    public AuthResponse registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("L'email est déjà utilisé.");
        }

        User user = User.builder()
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(Role.USER) // Rôle par défaut lors de l'inscription via le portail
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        String jwt = tokenProvider.generateToken(savedUser);

        return AuthResponse.builder()
                .token(jwt)
                .user(mapToUserResponse(savedUser))
                .build();
    }
    
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .specialty(user.getSpecialty())
                .avatar(user.getAvatar())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}