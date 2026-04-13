package com.pfa.helpdesk.controller;

import com.pfa.helpdesk.dto.response.AttachmentResponse;
import com.pfa.helpdesk.entity.Attachment;
import com.pfa.helpdesk.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentResponse> uploadFile(
            @PathVariable("ticketId") Long ticketId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        AttachmentResponse response = fileStorageService.storeFile(file, ticketId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AttachmentResponse>> getTicketAttachments(@PathVariable("ticketId") Long ticketId) {
        return ResponseEntity.ok(fileStorageService.getTicketAttachments(ticketId));
    }

    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable("ticketId") Long ticketId,
            @PathVariable("attachmentId") Long attachmentId) {
        
        Resource resource = fileStorageService.loadFileAsResource(attachmentId);
        Attachment attachment = fileStorageService.getAttachment(attachmentId);
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }
}