package com.pfa.helpdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Le mot de passe est obligatoire")
    private String newPassword;
}