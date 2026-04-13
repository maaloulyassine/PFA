package com.pfa.helpdesk.repository;

import com.pfa.helpdesk.entity.User;
import com.pfa.helpdesk.entity.enums.Role;
import com.pfa.helpdesk.entity.enums.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    List<User> findByRole(Role role);
    
    List<User> findByRoleAndSpecialty(Role role, Specialty specialty);
    
    boolean existsByEmail(String email);
}
