package com.pfa.helpdesk.service;

import com.pfa.helpdesk.entity.Ticket;
import com.pfa.helpdesk.entity.enums.Priority;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PriorityEngine {

    /**
     * Détermine le score de priorité et le niveau de priorité (LOW, MEDIUM, HIGH, CRITICAL)
     * ainsi que la deadline SLA relative.
     */
    public void assignPriorityAndSla(Ticket ticket) {
        int score = 0;

        // 1. Impact sur les utilisateurs (plus il y a de monde impacté, plus le score monte)
        if (ticket.getImpactedUsers() > 50) {
            score += 50;
        } else if (ticket.getImpactedUsers() > 10) {
            score += 30;
        } else if (ticket.getImpactedUsers() > 1) {
            score += 10;
        }

        // 2. Facteur par défaut / on pourrait aussi mapper via le nom de la catégorie (ex: Panne Réseau = +40)
        String catName = ticket.getCategory() != null ? ticket.getCategory().getName().toLowerCase() : "";
        if (catName.contains("réseau") || catName.contains("serveur")) {
            score += 40;
        } else if (catName.contains("matériel") || catName.contains("hardware")) {
            score += 20;
        }

        ticket.setPriorityScore(score);

        // Map le score final sur l'Enum Priority
        if (score >= 80) {
            ticket.setPriority(Priority.CRITICAL);
            ticket.setSlaDeadline(LocalDateTime.now().plusHours(2)); // Résolution max en 2h
        } else if (score >= 50) {
            ticket.setPriority(Priority.HIGH);
            ticket.setSlaDeadline(LocalDateTime.now().plusHours(8)); // Résolution max dans la journée
        } else if (score >= 20) {
            ticket.setPriority(Priority.MEDIUM);
            ticket.setSlaDeadline(LocalDateTime.now().plusDays(2)); // Max 48h
        } else {
            ticket.setPriority(Priority.LOW);
            ticket.setSlaDeadline(LocalDateTime.now().plusDays(5)); // Max 5 jours
        }
    }
}