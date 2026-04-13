package com.pfa.helpdesk.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_id", nullable = false)
    private User changedBy;

    @Column(nullable = false)
    private String action; // e.g., "CREATED", "STATUS_CHANGED", "ASSIGNED"

    private String oldValue;
    
    @Column(nullable = false)
    private String newValue;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    @PrePersist
    protected void onPersist() {
        changedAt = LocalDateTime.now();
    }
}
