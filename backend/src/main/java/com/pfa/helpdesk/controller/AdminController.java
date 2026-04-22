package com.pfa.helpdesk.controller;

import com.pfa.helpdesk.dto.response.StatisticsResponse;
import com.pfa.helpdesk.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final StatisticsService statisticsService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/statistics")
    public ResponseEntity<StatisticsResponse> getGlobalStatistics() {
        return ResponseEntity.ok(statisticsService.getGlobalStatistics());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/statistics/by-priority")
    public ResponseEntity<java.util.List<com.pfa.helpdesk.repository.PriorityStat>> getTicketsByPriority() {
        return ResponseEntity.ok(statisticsService.getTicketsByPriority());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/statistics/by-category")
    public ResponseEntity<java.util.List<com.pfa.helpdesk.repository.CategoryStat>> getTicketsByCategory() {
        return ResponseEntity.ok(statisticsService.getTicketsByCategory());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/statistics/technicians")
    public ResponseEntity<java.util.List<com.pfa.helpdesk.dto.response.TechnicianStatDTO>> getTechnicianPerformance() {
        return ResponseEntity.ok(statisticsService.getTechnicianPerformance());
    }
}