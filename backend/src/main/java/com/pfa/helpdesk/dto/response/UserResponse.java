package com.pfa.helpdesk.dto.response;

import com.pfa.helpdesk.entity.enums.Role;
import com.pfa.helpdesk.entity.enums.Specialty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
    private Specialty specialty;
    private boolean enabled;
    private LocalDateTime createdAt;
}