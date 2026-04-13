package com.pfa.helpdesk.service;

import com.pfa.helpdesk.dto.request.CreateTicketRequest;
import com.pfa.helpdesk.dto.response.TicketHistoryResponse;
import com.pfa.helpdesk.dto.response.TicketResponse;
import com.pfa.helpdesk.dto.response.UserResponse;
import java.util.List;
import java.util.stream.Collectors;
import com.pfa.helpdesk.entity.Category;
import com.pfa.helpdesk.entity.Ticket;
import com.pfa.helpdesk.entity.TicketHistory;
import com.pfa.helpdesk.entity.User;
import com.pfa.helpdesk.entity.enums.TicketStatus;
import com.pfa.helpdesk.repository.CategoryRepository;
import com.pfa.helpdesk.repository.TicketHistoryRepository;
import com.pfa.helpdesk.repository.TicketRepository;
import com.pfa.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    
    private final PriorityEngine priorityEngine;
    private final AssignmentEngine assignmentEngine;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, String currentUserEmail) {
        User creator = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(TicketStatus.OUVERT)
                .category(category)
                .createdBy(creator)
                .impactedUsers(request.getImpactedUsers())
                .build();

        // 1. Moteur d'intelligence : Calcul de priorité (Score + Deadline SLA)
        priorityEngine.assignPriorityAndSla(ticket);

        // 2. Moteur d'affectation auto : Assigner au meilleur technicien
        assignmentEngine.assignTechnicianAutomatically(ticket);

        // Si le ticket est assigné automatiquement, on le passe "EN_COURS" de base ou on force "OUVERT" c'est un choix métier
        if(ticket.getAssignedTo() != null) {
            ticket.setStatus(TicketStatus.EN_COURS);
        }

        Ticket savedTicket = ticketRepository.save(ticket);
        
        // --- 3. Historiser la création ---
        TicketHistory creationHistory = TicketHistory.builder()
                .ticket(savedTicket)
                .changedBy(creator)
                .action("CREATED")
                .newValue("Ticket Créé avec le statut: " + savedTicket.getStatus())
                .build();
        ticketHistoryRepository.save(creationHistory);

        // Déclencher Notification pour le changement de statut (vers l'auteur)
        notificationService.notifyUser(
            creator, 
            savedTicket, 
            "Votre ticket est enregistré : " + savedTicket.getTitle(), 
            "CREATED"
        );

        // Envoyer l'email
        emailService.sendEmail(
            creator.getEmail(), 
            "Confirmation de création du ticket #" + savedTicket.getId(), 
            "Bonjour " + creator.getFirstName() + ",\n\nVotre ticket a bien été pris en compte.\nStatut actuel : " + savedTicket.getStatus().name()
        );

        if (savedTicket.getAssignedTo() != null) {
            notificationService.notifyUser(
                savedTicket.getAssignedTo(), 
                savedTicket, 
                "Un nouveau ticket vous a été assigné : " + savedTicket.getTitle(), 
                "ASSIGNED"
            );
        }
        
        return mapToTicketResponse(savedTicket);
    }

    public Page<TicketResponse> getAllTickets(Pageable pageable) {
        return ticketRepository.findAll(pageable).map(this::mapToTicketResponse);
    }
    
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));
        return mapToTicketResponse(ticket);
    }

    public Page<TicketResponse> getMyTickets(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return ticketRepository.findByCreatedById(user.getId(), pageable).map(this::mapToTicketResponse);
    }

    public Page<TicketResponse> getAssignedTickets(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return ticketRepository.findByAssignedToId(user.getId(), pageable).map(this::mapToTicketResponse);
    }

    @Transactional
    public TicketResponse updateTicketStatus(Long id, TicketStatus newStatus, String currentUserEmail) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable"));

        User changer = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        TicketStatus oldStatus = ticket.getStatus();
        if(oldStatus == newStatus) {
            return mapToTicketResponse(ticket);
        }

        ticket.setStatus(newStatus);
        
        if (newStatus == TicketStatus.RESOLU || newStatus == TicketStatus.FERME) {
            ticket.setResolvedAt(java.time.LocalDateTime.now());
        }

        Ticket savedTicket = ticketRepository.save(ticket);

        // --- Historique du changement de statut ---
        TicketHistory history = TicketHistory.builder()
                .ticket(savedTicket)
                .changedBy(changer)
                .action("STATUS_CHANGED")
                .oldValue(oldStatus.name())
                .newValue(newStatus.name())
                .build();
        ticketHistoryRepository.save(history);
        
        // Déclencher Notification pour le changement de statut (vers l'auteur)
        notificationService.notifyUser(
            savedTicket.getCreatedBy(), 
            savedTicket, 
            "Votre ticket #" + savedTicket.getId() + " est passé au statut : " + newStatus, 
            "STATUS_CHANGED"
        );
        // Envoyer Email
        emailService.sendEmail(
            ticket.getCreatedBy().getEmail(), 
            "Mise à jour de votre ticket #" + savedTicket.getId(), 
            "Bonjour, \n\nL'état de votre ticket '" + savedTicket.getTitle() + "' a changé.\nNouveau statut : " + newStatus.name()
        );        
        return mapToTicketResponse(savedTicket);
    }

    public List<TicketHistoryResponse> getTicketHistory(Long ticketId) {
        return ticketHistoryRepository.findByTicketIdOrderByChangedAtDesc(ticketId).stream()
                .map(this::mapToHistoryResponse)
                .collect(Collectors.toList());
    }

    private TicketHistoryResponse mapToHistoryResponse(TicketHistory history) {
        return TicketHistoryResponse.builder()
                .id(history.getId())
                .ticketId(history.getTicket().getId())
                .changedById(history.getChangedBy().getId())
                .changedByName(history.getChangedBy().getFirstName() + " " + history.getChangedBy().getLastName())
                .changedByRole(history.getChangedBy().getRole().name())
                .action(history.getAction())
                .oldValue(history.getOldValue())
                .newValue(history.getNewValue())
                .changedAt(history.getChangedAt())
                .build();
    }

    private TicketResponse mapToTicketResponse(Ticket ticket) {
        TicketResponse response = TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .priorityScore(ticket.getPriorityScore())
                .impactedUsers(ticket.getImpactedUsers())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .slaDeadline(ticket.getSlaDeadline())
                .categoryId(ticket.getCategory().getId())
                .categoryName(ticket.getCategory().getName())
                .build();

        if (ticket.getCreatedBy() != null) {
            response.setCreatedBy(mapToUserResponse(ticket.getCreatedBy()));
        }
        
        if (ticket.getAssignedTo() != null) {
            response.setAssignedTo(mapToUserResponse(ticket.getAssignedTo()));
        }

        return response;
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .specialty(user.getSpecialty())
                .build();
    }
}