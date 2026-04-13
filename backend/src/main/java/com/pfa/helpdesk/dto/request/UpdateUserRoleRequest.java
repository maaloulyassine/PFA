package com.pfa.helpdesk.dto.request;

import com.pfa.helpdesk.entity.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserRoleRequest {

    @NotNull(message = "Le rôle est obligatoire")
    private Role role;
}