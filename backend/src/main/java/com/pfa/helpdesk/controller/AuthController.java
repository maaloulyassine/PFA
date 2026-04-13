package com.pfa.helpdesk.controller;

import com.pfa.helpdesk.dto.request.LoginRequest;
import com.pfa.helpdesk.dto.request.RegisterRequest;
import com.pfa.helpdesk.dto.response.AuthResponse;
import com.pfa.helpdesk.dto.response.UserResponse;
import com.pfa.helpdesk.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.authenticateUser(loginRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        return ResponseEntity.ok(authService.registerUser(registerRequest));
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails customUserDetails) {
        return ResponseEntity.ok(authService.getCurrentUser(customUserDetails.getUsername()));
    }
}