package com.pfa.helpdesk.dto.request;

import com.pfa.helpdesk.entity.enums.Role;
import com.pfa.helpdesk.entity.enums.Specialty;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String firstName;
    private String lastName;
    private Role role;
    private Specialty specialty;
    private Boolean enabled;
}
