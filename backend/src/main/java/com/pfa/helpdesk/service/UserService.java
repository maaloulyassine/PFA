package com.pfa.helpdesk.service;

import com.pfa.helpdesk.dto.request.CreateUserRequest;
import com.pfa.helpdesk.dto.request.UpdateUserRequest;
import com.pfa.helpdesk.dto.response.UserResponse;
import com.pfa.helpdesk.entity.User;
import com.pfa.helpdesk.entity.enums.Role;
import com.pfa.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::mapToResponse);
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("L'email est déjà utilisé par un autre compte !");
        }

        User newUser = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .specialty(request.getRole() == Role.TECHNICIEN ? request.getSpecialty() : null)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(newUser);
        return mapToResponse(savedUser);
    }
    @Transactional
public void resetUserPassword(Long id, String newPassword) {
    User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

    user.setPassword(passwordEncoder.encode(newPassword));
    userRepository.save(user);
}

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getEnabled() != null) user.setEnabled(request.getEnabled());
        
        if (user.getRole() == Role.TECHNICIEN) {
            if (request.getSpecialty() != null) user.setSpecialty(request.getSpecialty());
        } else {
            user.setSpecialty(null);
        }

        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public void disableUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        user.setEnabled(false); // Soft Delete
        userRepository.save(user);
    }

    @Transactional
    public UserResponse changeUserRole(Long id, Role newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        user.setRole(newRole);
        // Si on rétrograde un technicien en utilisateur simple, on lui retire sa spécialité
        if (newRole != Role.TECHNICIEN) {
            user.setSpecialty(null);
        }
        
        return mapToResponse(userRepository.save(user));
    }

    public List<UserResponse> getAvailableTechnicians() {
        return userRepository.findByRole(Role.TECHNICIEN).stream()
                .filter(User::isEnabled)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateCurrentUserProfile(String email, java.util.Map<String, Object> updates) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (updates.containsKey("firstName") && updates.get("firstName") != null) {
            user.setFirstName(updates.get("firstName").toString());
        }
        if (updates.containsKey("lastName") && updates.get("lastName") != null) {
            user.setLastName(updates.get("lastName").toString());
        }
        if (updates.containsKey("avatar") && updates.get("avatar") != null) {
            user.setAvatar(updates.get("avatar").toString());
        }

        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }

    private UserResponse mapToResponse(User user) {
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