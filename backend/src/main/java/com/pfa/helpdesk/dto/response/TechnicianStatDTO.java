package com.pfa.helpdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TechnicianStatDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String specialty;
    private Long assigned;
    private Long resolved;
    private Double avgHours;
}
