package com.clinique.gestion.dto;

import com.clinique.gestion.entity.TypeNotification;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDto {
    private Long id;
    private Long utilisateurId;
    private String titre;
    private String message;
    private TypeNotification type;
    private boolean lue;
    private LocalDateTime dateCreation;
    private Long referenceId;
    private String referenceType;
}
