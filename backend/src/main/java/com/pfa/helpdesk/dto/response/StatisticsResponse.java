package com.pfa.helpdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StatisticsResponse {
    private long totalTickets;
    private long openTickets;
    private long inProgressTickets;
    private long resolvedTickets;
    private long closedTickets;
    
    private long resolvedToday; // ADDED
    private double avgResolutionHours; // ADDED
    
    // Pour des KPIs plus poussés
    private double resolutionRate; 
    private double satisfactionRate; // ADDED
}