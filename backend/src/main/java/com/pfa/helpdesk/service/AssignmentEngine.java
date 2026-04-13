package com.pfa.helpdesk.service;

import com.pfa.helpdesk.entity.Ticket;
import com.pfa.helpdesk.entity.User;
import com.pfa.helpdesk.entity.enums.Role;
import com.pfa.helpdesk.entity.enums.Specialty;
import com.pfa.helpdesk.repository.TicketRepository;
import com.pfa.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssignmentEngine {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;

    /**
     * Assigne automatiquement un technicien à la création d'un ticket.
     */
    public void assignTechnicianAutomatically(Ticket ticket) {
        // Déterminer la spécialité requise selon la catégorie
        Specialty requiredSpecialty = determineSpecialtyFromCategory(ticket.getCategory().getName());

        // 1. Chercher tous les techniciens avec la spécialité requise
        List<User> candidates;
        if (requiredSpecialty != null) {
            candidates = userRepository.findByRoleAndSpecialty(Role.TECHNICIEN, requiredSpecialty);
        } else {
            candidates = userRepository.findByRole(Role.TECHNICIEN);
        }

        // S'il n'y a personne, on le laisse non assigné
        if (candidates.isEmpty()) {
            return;
        }

        // 2. Trouver le technicien qui a le moins de tickets "EN_COURS" ou "OUVERT"
        // Note: C'est un algo simpliste. Idéalement, on compte les tickets via le TicketRepository
        User bestCandidate = null;
        int minTickets = Integer.MAX_VALUE;

        for (User tech : candidates) {
            int currentLoad = ticketRepository.countByAssignedToIdAndStatusIn(
                    tech.getId(), 
                    List.of(com.pfa.helpdesk.entity.enums.TicketStatus.OUVERT, com.pfa.helpdesk.entity.enums.TicketStatus.EN_COURS)
            );
            
            if (currentLoad < minTickets) {
                minTickets = currentLoad;
                bestCandidate = tech;
            }
        }

        ticket.setAssignedTo(bestCandidate);
    }

    private Specialty determineSpecialtyFromCategory(String categoryName) {
        if (categoryName == null) return null;
        String name = categoryName.toLowerCase();
        if (name.contains("réseau") || name.contains("internet")) return Specialty.RESEAU;
        if (name.contains("logiciel") || name.contains("software")) return Specialty.LOGICIEL;
        if (name.contains("imprimante") || name.contains("scanner")) return Specialty.IMPRIMANTE;
        if (name.contains("matériel") || name.contains("pc")) return Specialty.MATERIEL;
        return null;
    }
}