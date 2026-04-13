package com.pfa.helpdesk.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TicketHistoryResponse {
    private Long id;
    private Long ticketId;
    private Long changedById;
    private String changedByName;
    private String changedByRole;
    private String action;
    private String oldValue;
    private String newValue;
    private LocalDateTime changedAt;
}