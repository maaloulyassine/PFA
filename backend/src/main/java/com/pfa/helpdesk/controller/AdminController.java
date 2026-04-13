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
}