package com.pfa.helpdesk.service;

import com.pfa.helpdesk.dto.response.AttachmentResponse;
import com.pfa.helpdesk.entity.Attachment;
import com.pfa.helpdesk.entity.Ticket;
import com.pfa.helpdesk.entity.User;
import com.pfa.helpdesk.repository.AttachmentRepository;
import com.pfa.helpdesk.repository.TicketRepository;
import com.pfa.helpdesk.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;
    private final AttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir,
                              AttachmentRepository attachmentRepository,
                              TicketRepository ticketRepository,
                              UserRepository userRepository) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.attachmentRepository = attachmentRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Impossible de créer le répertoire de stockage.", ex);
        }
    }

    public AttachmentResponse storeFile(MultipartFile file, Long ticketId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket non trouvé"));

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        
        if(originalFileName.contains("..")) {
            throw new RuntimeException("Le nom du fichier contient une séquence de chemin invalide " + originalFileName);
        }

        // On génère un nom unique pour éviter les conflits
        String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFileName;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Attachment attachment = Attachment.builder()
                    .fileName(originalFileName)
                    .fileType(file.getContentType())
                    .filePath(uniqueFileName)
                    .ticket(ticket)
                    .uploadedBy(user)
                    .build();

            Attachment savedAttachment = attachmentRepository.save(attachment);
            return mapToResponse(savedAttachment);

        } catch (IOException ex) {
            throw new RuntimeException("Impossible de stocker le fichier " + originalFileName, ex);
        }
    }

    public Resource loadFileAsResource(Long attachmentId) {
        Attachment attachment = getAttachment(attachmentId);
        try {
            Path filePath = this.fileStorageLocation.resolve(attachment.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if(resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("Fichier introuvable " + attachment.getFileName());
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("Fichier introuvable " + attachment.getFileName(), ex);
        }
    }

    public Attachment getAttachment(Long id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pièce jointe introuvable"));
    }

    public List<AttachmentResponse> getTicketAttachments(Long ticketId) {
        return attachmentRepository.findByTicketId(ticketId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AttachmentResponse mapToResponse(Attachment a) {
        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/tickets/")
                .path(a.getTicket().getId().toString())
                .path("/attachments/")
                .path(a.getId().toString())
                .path("/download")
                .toUriString();

        return AttachmentResponse.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .fileType(a.getFileType())
                .ticketId(a.getTicket().getId())
                .uploadedById(a.getUploadedBy().getId())
                .uploadedByName(a.getUploadedBy().getFirstName() + " " + a.getUploadedBy().getLastName())
                .uploadedAt(a.getUploadedAt())
                .downloadUrl(fileDownloadUri)
                .build();
    }
}