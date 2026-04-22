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

        // 1. Analyse de la description pour détecter l'urgence
        String desc = ticket.getDescription() != null ? ticket.getDescription().toLowerCase() : "";
        if (desc.matches(".*(urgent|critique|bloqué|panne générale|immédiat|tout le monde|plus rien ne marche).*")) {
            score += 50;
        } else if (desc.matches(".*(important|grave|impossible de travailler|dérangeant).*")) {
            score += 30;
        } else if (desc.matches(".*(lent|gênant|souci|petit problème).*")) {
            score += 10;
        }

        // 2. Facteur par défaut / on pourrait aussi mapper via le nom de la catégorie
        String catName = ticket.getCategory() != null ? ticket.getCategory().getName().toLowerCase() : "";
        if (catName.contains("réseau") || catName.contains("sécurité")) {
            // Un problème Réseau ou Sécurité donne +40 pts
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