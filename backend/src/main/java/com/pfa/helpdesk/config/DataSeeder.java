package com.pfa.helpdesk.config;

import com.pfa.helpdesk.entity.Category;
import com.pfa.helpdesk.entity.User;
import com.pfa.helpdesk.entity.enums.Role;
import com.pfa.helpdesk.entity.enums.Specialty;
import com.pfa.helpdesk.repository.CategoryRepository;
import com.pfa.helpdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Ajouter l'Admin par défaut
        if (!userRepository.existsByEmail("admin@helpdesk.com")) {
            userRepository.save(User.builder()
                    .firstName("Admin")
                    .lastName("Super")
                    .email("admin@helpdesk.com")
                    .password(passwordEncoder.encode("admin1234"))
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build());
        }

        // 2. Ajouter un Technicien Réseau pour nos tests d'assignation
        if (!userRepository.existsByEmail("tech@helpdesk.com")) {
            userRepository.save(User.builder()
                    .firstName("Bob")
                    .lastName("Le Technicien")
                    .email("tech@helpdesk.com")
                    .password(passwordEncoder.encode("tech1234"))
                    .role(Role.TECHNICIEN)
                    .specialty(Specialty.RESEAU)
                    .enabled(true)
                    .build());
        }

        // 3. Ajouter les Catégories de base
        if (categoryRepository.count() == 0) {
            categoryRepository.saveAll(List.of(
                    Category.builder().name("Problème Réseau / Internet").description("Connexion, VPN, Wifi").build(),
                    Category.builder().name("Problème Matériel PC").description("Ecran, Clavier, Disque dur").build(),
                    Category.builder().name("Problème Logiciel").description("Installation, Bug applicatif").build(),
                    Category.builder().name("Problème Imprimante").description("Bourrage, Toner").build()
            ));
        }
    }
}