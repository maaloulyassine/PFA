package com.pfa.helpdesk.repository;

import com.pfa.helpdesk.entity.Ticket;
import com.pfa.helpdesk.entity.enums.Priority;
import com.pfa.helpdesk.entity.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    Page<Ticket> findByCreatedById(Long userId, Pageable pageable);
    
    Page<Ticket> findByAssignedToId(Long technicianId, Pageable pageable);
    
    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);
    
    Page<Ticket> findByPriority(Priority priority, Pageable pageable);
    
    long countByStatus(TicketStatus status);
    
    int countByAssignedToIdAndStatusIn(Long assignedToId, java.util.Collection<TicketStatus> statuses);
}