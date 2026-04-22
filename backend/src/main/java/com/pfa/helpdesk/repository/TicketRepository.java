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

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = :status AND t.resolvedAt >= :since")
    long countByStatusAndResolvedAtAfter(@org.springframework.data.repository.query.Param("status") TicketStatus status, @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

    @org.springframework.data.jpa.repository.Query("SELECT t.createdAt, t.resolvedAt, t.slaDeadline FROM Ticket t WHERE t.status IN :statuses AND t.resolvedAt IS NOT NULL")
    java.util.List<Object[]> findResolvedTicketsTimestamps(@org.springframework.data.repository.query.Param("statuses") java.util.List<TicketStatus> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT t.priority as priority, COUNT(t) as count FROM Ticket t GROUP BY t.priority")
    java.util.List<PriorityStat> countByPriority();

    @org.springframework.data.jpa.repository.Query("SELECT c.name as category, COUNT(t) as count FROM Ticket t JOIN t.category c GROUP BY c.name")
    java.util.List<CategoryStat> countByCategory();

    @org.springframework.data.jpa.repository.Query("SELECT u.id as id, u.firstName as firstName, u.lastName as lastName, u.specialty as specialty, COUNT(t) as assigned, SUM(CASE WHEN t.status IN ('RESOLU', 'FERME') THEN 1 ELSE 0 END) as resolved FROM Ticket t JOIN t.assignedTo u GROUP BY u.id, u.firstName, u.lastName, u.specialty")
    java.util.List<TechnicianStat> getTechnicianStats();

    @org.springframework.data.jpa.repository.Query("SELECT t.assignedTo.id, t.createdAt, t.resolvedAt FROM Ticket t WHERE t.assignedTo IS NOT NULL AND t.status IN ('RESOLU', 'FERME') AND t.resolvedAt IS NOT NULL")
    java.util.List<Object[]> findResolvedTicketsTimestampsGroupedByTech();
    
    long countByStatus(TicketStatus status);
    
    int countByAssignedToIdAndStatusIn(Long assignedToId, java.util.Collection<TicketStatus> statuses);
}