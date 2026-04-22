package com.pfa.helpdesk.service;

import com.pfa.helpdesk.dto.response.CategoryResponse;
import com.pfa.helpdesk.dto.request.CreateCommentRequest;
import com.pfa.helpdesk.dto.request.CreateTicketRequest;
import com.pfa.helpdesk.dto.response.CommentResponse;
import com.pfa.helpdesk.dto.response.TicketHistoryResponse;
import com.pfa.helpdesk.dto.response.TicketResponse;
import com.pfa.helpdesk.entity.Category;
import com.pfa.helpdesk.entity.Comment;
import com.pfa.helpdesk.entity.Ticket;
import com.pfa.helpdesk.entity.TicketHistory;
import com.pfa.helpdesk.entity.User;
import com.pfa.helpdesk.entity.enums.TicketStatus;
import com.pfa.helpdesk.repository.CategoryRepository;
import com.pfa.helpdesk.repository.CommentRepository;
import com.pfa.helpdesk.repository.TicketHistoryRepository;
import com.pfa.helpdesk.repository.TicketRepository;
import com.pfa.helpdesk.repository.UserRepository;
import com.pfa.helpdesk.repository.AttachmentRepository;
import com.pfa.helpdesk.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final AttachmentRepository attachmentRepository;
    private final NotificationRepository notificationRepository;
    
    private final PriorityEngine priorityEngine;
    private final AssignmentEngine assignmentEngine;
    private final AICategorizationEngine aiCategorizationEngine;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, String currentUserEmail) {
        User creator = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Catégorie introuvable avec l'ID: " + request.getCategoryId()));
        }

        // Convert priority string to enum
        com.pfa.helpdesk.entity.enums.Priority priority = com.pfa.helpdesk.entity.enums.Priority.valueOf(request.getPriority());

        // Calculate SLA deadline based on priority
        LocalDateTime slaDeadline = calculateSLADeadline(priority);

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(TicketStatus.OUVERT)
                .category(category)
                .priority(priority)
                .slaDeadline(slaDeadline)
                .createdBy(creator)
                .build();

        assignmentEngine.assignTechnicianAutomatically(ticket);

        Ticket savedTicket = ticketRepository.save(ticket);
        
        messagingTemplate.convertAndSend("/topic/tickets", "{\"type\":\"TICKET_CREATED\"}");
        
        notificationService.notifyUser(creator, savedTicket, "Votre ticket a été créé avec succès.", "INFO");
        try {
            emailService.sendEmail(
                    creator.getEmail(),
                    "Ticket créé: #" + savedTicket.getId(),
                    "Votre ticket '" + savedTicket.getTitle() + "' a été créé avec succès."
            );
        } catch (Exception e) {
            log.error("Could not send email", e);
        }

        if (savedTicket.getAssignedTo() != null) {
            notificationService.notifyUser(savedTicket.getAssignedTo(), savedTicket, "Un nouveau ticket vous a été assigné: " + savedTicket.getTitle(), "ASSIGNED");
            try {
                emailService.sendEmail(
                        savedTicket.getAssignedTo().getEmail(),
                        "Nouveau ticket assigné: #" + savedTicket.getId(),
                        "Le ticket '" + savedTicket.getTitle() + "' vous a été assigné.\nConnectez-vous pour le consulter."
                );
            } catch (Exception e) {
                log.error("Could not send email to technician", e);
            }
        }

        return mapToResponse(savedTicket);
    }

    private LocalDateTime calculateSLADeadline(com.pfa.helpdesk.entity.enums.Priority priority) {
        LocalDateTime now = LocalDateTime.now();
        switch (priority) {
            case CRITICAL:
                return now.plusHours(2);
            case HIGH:
                return now.plusHours(8);
            case MEDIUM:
                return now.plusHours(24);
            case LOW:
            default:
                return now.plusDays(3);
        }
    }

    public Page<TicketResponse> getAllTickets(Pageable pageable) {
        return ticketRepository.findAll(pageable).map(this::mapToResponse);
    }

    public Page<TicketResponse> getMyTickets(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return ticketRepository.findByCreatedById(user.getId(), pageable).map(this::mapToResponse);
    }

    public Page<TicketResponse> getAssignedTickets(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return ticketRepository.findByAssignedToId(user.getId(), pageable).map(this::mapToResponse);
    }

    public TicketResponse getTicketById(Long id) {
        return mapToResponse(ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé")));
    }

    @Transactional
    public TicketResponse updateTicketStatus(Long id, TicketStatus newStatus, String currentUserEmail) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
                
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (currentUser.getRole() == com.pfa.helpdesk.entity.enums.Role.TECHNICIEN) {
            if (currentUser.getSpecialty() == null || ticket.getCategory() == null) {
                throw new RuntimeException("Accès refusé: vous ne pouvez pas modifier ce ticket");
            }
            String userSpecialtyStr = currentUser.getSpecialty().name().toLowerCase();
            String catNameStr = java.text.Normalizer.normalize(ticket.getCategory().getName(), java.text.Normalizer.Form.NFD)
                            .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                            .toLowerCase();
            if (!catNameStr.contains(userSpecialtyStr)) {
                throw new RuntimeException("Accès refusé: ce ticket ne correspond pas à votre spécialité");
            }
        }
                
        ticket.setStatus(newStatus);
        
        if (newStatus == TicketStatus.RESOLU || newStatus == TicketStatus.FERME) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        Ticket saved = ticketRepository.save(ticket);
        
        messagingTemplate.convertAndSend("/topic/tickets", "{\"type\":\"TICKET_UPDATED\"}");

        if (!saved.getCreatedBy().getEmail().equals(currentUserEmail)) {
            notificationService.notifyUser(saved.getCreatedBy(), saved, "Le statut de votre ticket a été mis à jour : " + newStatus, "STATUS");
            try {
                emailService.sendEmail(
                        saved.getCreatedBy().getEmail(),
                        "Mise à jour de votre ticket: #" + saved.getId(),
                        "Le statut de votre ticket '" + saved.getTitle() + "' a été mis à jour.\nNouveau statut: " + newStatus
                );
            } catch (Exception e) {
                log.error("Could not send status update email", e);
            }
        }

        if (saved.getAssignedTo() != null && !saved.getAssignedTo().getEmail().equals(currentUserEmail)) {
            notificationService.notifyUser(saved.getAssignedTo(), saved, "Le ticket #" + saved.getId() + " a été mis à jour : " + newStatus, "STATUS");
            try {
                emailService.sendEmail(
                        saved.getAssignedTo().getEmail(),
                        "Mise à jour du ticket assigné: #" + saved.getId(),
                        "Le statut du ticket '" + saved.getTitle() + "' qui vous est assigné a été mis à jour.\nNouveau statut: " + newStatus
                );
            } catch (Exception e) {
                log.error("Could not send status update email to technician", e);
            }
        }

        return mapToResponse(saved);
    }

    @Transactional
    public CommentResponse addComment(Long ticketId, CreateCommentRequest request, String currentUserEmail) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
        User author = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .ticket(ticket)
                .author(author)
                .build();

        Comment savedComment = commentRepository.save(comment);

        messagingTemplate.convertAndSend("/topic/tickets", "{\"type\":\"TICKET_UPDATED\"}");

        if (!author.getId().equals(ticket.getCreatedBy().getId())) {
            notificationService.notifyUser(ticket.getCreatedBy(), ticket, "Nouveau commentaire sur votre ticket", "COMMENT");
            try {
                emailService.sendEmail(
                        ticket.getCreatedBy().getEmail(),
                        "Nouveau commentaire sur votre ticket: #" + ticket.getId(),
                        author.getFirstName() + " a ajouté un commentaire sur votre ticket '" + ticket.getTitle() + "'.\n\n\"" + request.getContent() + "\""
                );
            } catch (Exception e) {
                log.error("Could not send comment email to creator", e);
            }
        }
        
        if (ticket.getAssignedTo() != null && !author.getId().equals(ticket.getAssignedTo().getId())) {
            notificationService.notifyUser(ticket.getAssignedTo(), ticket, "Nouveau commentaire sur le ticket " + ticket.getId(), "COMMENT");
            try {
                emailService.sendEmail(
                        ticket.getAssignedTo().getEmail(),
                        "Nouveau commentaire sur le ticket assigné: #" + ticket.getId(),
                        author.getFirstName() + " a ajouté un commentaire sur le ticket '" + ticket.getTitle() + "'.\n\n\"" + request.getContent() + "\""
                );
            } catch (Exception e) {
                log.error("Could not send comment email to technician", e);
            }
        }

        return CommentResponse.builder()
            .id(savedComment.getId())
            .content(savedComment.getContent())
            .authorId(author.getId())
            .authorName(author.getFirstName() + " " + author.getLastName())
            .authorRole(author.getRole() != null ? author.getRole().name() : null)
            .createdAt(savedComment.getCreatedAt())
            .build();
    }

    public List<TicketHistoryResponse> getTicketHistory(Long id) {
        return ticketHistoryRepository.findByTicketIdOrderByChangedAtDesc(id)
                .stream()
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

    private TicketResponse mapToResponse(Ticket ticket) {
        CategoryResponse categoryResponse = ticket.getCategory() != null ? 
                CategoryResponse.builder()
                        .id(ticket.getCategory().getId())
                        .name(ticket.getCategory().getName())
                        .description(ticket.getCategory().getDescription())
                        .build() : null;

        List<CommentResponse> commentsList = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId())
                .stream()
                .map(c -> CommentResponse.builder()
                        .id(c.getId())
                        .content(c.getContent())
                        .authorId(c.getAuthor().getId())
                        .authorName(c.getAuthor().getFirstName() + " " + c.getAuthor().getLastName())
                        .authorRole(c.getAuthor().getRole() != null ? c.getAuthor().getRole().name() : null)
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority() != null ? ticket.getPriority().name() : null)
                .category(categoryResponse)
                .createdBy(mapUserResponse(ticket.getCreatedBy()))
                .assignedTo(mapUserResponse(ticket.getAssignedTo()))
                .comments(commentsList)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .slaDeadline(ticket.getSlaDeadline())
                .priorityScore(ticket.getPriorityScore())
                .build();
    }

    private com.pfa.helpdesk.dto.response.UserResponse mapUserResponse(User user) {
        if (user == null) {
            return null;
        }

        return com.pfa.helpdesk.dto.response.UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .specialty(user.getSpecialty())
                .avatar(user.getAvatar())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteTicket(Long id, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
                
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));
                
        if (currentUser.getRole() != com.pfa.helpdesk.entity.enums.Role.ADMIN) {
            throw new RuntimeException("Accès refusé: Seuls les administrateurs peuvent supprimer des tickets.");
        }
        
        attachmentRepository.deleteByTicketId(id);
        commentRepository.deleteByTicketId(id);
        ticketHistoryRepository.deleteByTicketId(id);
        notificationRepository.deleteByTicketId(id);
        
        ticketRepository.delete(ticket);
        
        messagingTemplate.convertAndSend("/topic/tickets", "{\"type\":\"TICKET_DELETED\"}");
    }
}
