package com.pfa.helpdesk.service;

import com.pfa.helpdesk.dto.request.CreateCommentRequest;
import com.pfa.helpdesk.dto.response.CommentResponse;
import com.pfa.helpdesk.entity.Comment;
import com.pfa.helpdesk.entity.Ticket;
import com.pfa.helpdesk.entity.User;
import com.pfa.helpdesk.repository.CommentRepository;
import com.pfa.helpdesk.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;
    private final com.pfa.helpdesk.repository.UserRepository userRepository;

    @Transactional
    public CommentResponse addComment(Long ticketId, CreateCommentRequest request, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé avec l'id: " + ticketId));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .ticket(ticket)
                .author(author)
                .build();

        comment = commentRepository.save(comment);

        // Envoyer une notification ciblée
        notifyInvolvedParties(ticket, author);

        return mapToResponse(comment);
    }

    public List<CommentResponse> getCommentsByTicketId(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void notifyInvolvedParties(Ticket ticket, User author) {
        String message = "Nouveau commentaire sur le ticket #" + ticket.getId() + " par " + author.getFirstName();

        // Notifier le créateur si ce n'est pas lui qui a commenté
        if (!ticket.getCreatedBy().getId().equals(author.getId())) {
            notificationService.notifyUser(ticket.getCreatedBy(), ticket, message, "NEW_COMMENT");
        }

        // Notifier le technicien assigné s'il y en a un et que ce n'est pas lui qui a commenté
        if (ticket.getAssignedTo() != null && !ticket.getAssignedTo().getId().equals(author.getId())) {
            notificationService.notifyUser(ticket.getAssignedTo(), ticket, message, "NEW_COMMENT");
        }
    }

    private CommentResponse mapToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getFirstName() + " " + comment.getAuthor().getLastName())
                .authorRole(comment.getAuthor().getRole().name())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}