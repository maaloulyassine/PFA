package com.pfa.helpdesk.repository;

public interface TechnicianStat {
    Long getId();
    String getFirstName();
    String getLastName();
    String getSpecialty();
    Long getAssigned();
    Long getResolved();
    // Avg hours could just be part of business logic or hardcoded
}