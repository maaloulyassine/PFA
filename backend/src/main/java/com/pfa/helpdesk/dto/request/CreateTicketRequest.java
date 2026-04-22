package com.pfa.helpdesk.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateTicketRequest {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200, message = "Le titre ne doit pas dépasser 200 caractères")
    private String title;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    private Long categoryId;

    @NotBlank(message = "La priorité est obligatoire")
    private String priority;
}