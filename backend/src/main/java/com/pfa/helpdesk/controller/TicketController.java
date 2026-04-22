package com.pfa.helpdesk.controller;

import com.pfa.helpdesk.dto.request.CreateTicketRequest;
import com.pfa.helpdesk.dto.response.TicketHistoryResponse;
import com.pfa.helpdesk.dto.response.TicketResponse;
import com.pfa.helpdesk.service.TicketService;
import java.util.List;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.pfa.helpdesk.entity.enums.TicketStatus;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal UserDetails customUserDetails) {
        
        String currentUserEmail = customUserDetails.getUsername();
        TicketResponse createdTicket = ticketService.createTicket(request, currentUserEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTicket);
    }

    @GetMapping
    public ResponseEntity<Page<TicketResponse>> getAllTickets(@org.springdoc.core.annotations.ParameterObject Pageable pageable) {
        return ResponseEntity.ok(ticketService.getAllTickets(pageable));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @GetMapping("/mine")
    public ResponseEntity<Page<TicketResponse>> getMyTickets(
            @AuthenticationPrincipal UserDetails userDetails, @org.springdoc.core.annotations.ParameterObject Pageable pageable) {
        return ResponseEntity.ok(ticketService.getMyTickets(userDetails.getUsername(), pageable));
    }

    @GetMapping("/assigned")
    public ResponseEntity<Page<TicketResponse>> getAssignedTickets(
            @AuthenticationPrincipal UserDetails userDetails, @org.springdoc.core.annotations.ParameterObject Pageable pageable) {
        return ResponseEntity.ok(ticketService.getAssignedTickets(userDetails.getUsername(), pageable));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody com.pfa.helpdesk.dto.request.UpdateStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, request.getStatus(), userDetails.getUsername()));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketHistoryResponse>> getTicketHistory(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ticketService.getTicketHistory(id));
    }
    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        ticketService.deleteTicket(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
