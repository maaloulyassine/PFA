package com.pfa.helpdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCommentRequest {
    @NotBlank(message = "Le contenu du commentaire est obligatoire")
    private String content;
}