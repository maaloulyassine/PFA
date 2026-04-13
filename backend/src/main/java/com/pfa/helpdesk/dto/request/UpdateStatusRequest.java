package com.pfa.helpdesk.dto.request;

import com.pfa.helpdesk.entity.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateStatusRequest {

    @NotNull(message = "Le statut est obligatoire")
    private TicketStatus status;
}