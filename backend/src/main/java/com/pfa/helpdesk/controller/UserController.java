package com.pfa.helpdesk.controller;

import com.pfa.helpdesk.dto.request.CreateUserRequest;
import com.pfa.helpdesk.dto.request.UpdateUserRequest;
import com.pfa.helpdesk.dto.request.UpdateUserRoleRequest;
import com.pfa.helpdesk.dto.response.UserResponse;
import com.pfa.helpdesk.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.pfa.helpdesk.dto.request.ResetPasswordRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @org.springdoc.core.annotations.ParameterObject 
            @org.springframework.data.web.PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }
    @PreAuthorize("hasRole('ADMIN')")
@PutMapping("/{id}/password")
public ResponseEntity<Void> resetUserPassword(
        @PathVariable("id") Long id,
        @Valid @RequestBody ResetPasswordRequest request) {
    userService.resetUserPassword(id, request.getNewPassword());
    return ResponseEntity.noContent().build();
}

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> disableUser(@PathVariable("id") Long id) {
        userService.disableUser(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponse> changeRole(
            @PathVariable("id") Long id, 
            @Valid @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(userService.changeUserRole(id, request.getRole()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIEN', 'USER')")
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(userService.updateCurrentUserProfile(userDetails.getUsername(), updates));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIEN')")
    @GetMapping("/technicians")
    public ResponseEntity<List<UserResponse>> getTechnicians() {
        return ResponseEntity.ok(userService.getAvailableTechnicians());
    }
}