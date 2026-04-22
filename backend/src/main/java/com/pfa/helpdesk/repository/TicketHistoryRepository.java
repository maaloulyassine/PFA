package com.pfa.helpdesk.repository;

import com.pfa.helpdesk.entity.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    List<TicketHistory> findByTicketIdOrderByChangedAtDesc(Long ticketId);
    void deleteByTicketId(Long ticketId);
}