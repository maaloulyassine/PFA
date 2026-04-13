package com.pfa.helpdesk.service;

import com.pfa.helpdesk.dto.response.StatisticsResponse;
import com.pfa.helpdesk.entity.enums.TicketStatus;
import com.pfa.helpdesk.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final TicketRepository ticketRepository;

    public StatisticsResponse getGlobalStatistics() {
        long total = ticketRepository.count();
        long open = ticketRepository.countByStatus(TicketStatus.OUVERT);
        long inProgress = ticketRepository.countByStatus(TicketStatus.EN_COURS);
        long resolved = ticketRepository.countByStatus(TicketStatus.RESOLU);
        long closed = ticketRepository.countByStatus(TicketStatus.FERME);

        double resolutionRate = 0.0;
        if (total > 0) {
            resolutionRate = ((double) (resolved + closed) / total) * 100;
        }

        return StatisticsResponse.builder()
                .totalTickets(total)
                .openTickets(open)
                .inProgressTickets(inProgress)
                .resolvedTickets(resolved)
                .closedTickets(closed)
                .resolutionRate(Math.round(resolutionRate * 100.0) / 100.0) // Arrondir à 2 décimales
                .build();
    }
}