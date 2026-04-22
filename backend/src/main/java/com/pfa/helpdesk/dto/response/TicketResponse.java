package com.pfa.helpdesk.dto.response;

import com.pfa.helpdesk.entity.enums.Priority;
import com.pfa.helpdesk.entity.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketResponse {
    
    private Long id;
    private String title;
    private String description;
    private TicketStatus status;
    private String priority;
    private Integer priorityScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime slaDeadline;
    
    private UserResponse createdBy;
    private UserResponse assignedTo;
    
    private CategoryResponse category;

    private java.util.List<CommentResponse> comments;
}