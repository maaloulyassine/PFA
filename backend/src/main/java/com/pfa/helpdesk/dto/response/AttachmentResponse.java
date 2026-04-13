package com.pfa.helpdesk.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AttachmentResponse {
    private Long id;
    private String fileName;
    private String fileType;
    private Long ticketId;
    private Long uploadedById;
    private String uploadedByName;
    private LocalDateTime uploadedAt;
    private String downloadUrl;
}