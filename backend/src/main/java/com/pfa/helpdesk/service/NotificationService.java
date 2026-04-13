package com.pfa.helpdesk.service;

import com.pfa.helpdesk.dto.response.NotificationResponse;
import com.pfa.helpdesk.entity.Notification;
import com.pfa.helpdesk.entity.Ticket;
import com.pfa.helpdesk.entity.User;
import com.pfa.helpdesk.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifyUser(User user, Ticket ticket, String message, String type) {
        if (user == null) return;

        // 1. Sauvegarder dans PostgreSQL
        Notification notification = Notification.builder()
                .user(user)
                .ticket(ticket)
                .message(message)
                .type(type)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // 2. Envoyer en Temps Réel via WebSocket (STOMP)
        NotificationResponse payload = mapToResponse(saved);
        messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/notifications",
                payload
        );
    }

    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .type(n.getType())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .ticketId(n.getTicket() != null ? n.getTicket().getId() : null)
                .build();
    }
}