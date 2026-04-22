package com.pfa.helpdesk.config;

import com.pfa.helpdesk.entity.Category;
import com.pfa.helpdesk.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        // Créer les catégories par défaut si elles n'existent pas
        if (categoryRepository.count() == 0) {
            categoryRepository.save(Category.builder().name("Réseau").description("Problèmes de réseau").build());
            categoryRepository.save(Category.builder().name("Logiciel").description("Problèmes de logiciel").build());
            categoryRepository.save(Category.builder().name("Matériel").description("Problèmes de matériel").build());
            categoryRepository.save(Category.builder().name("Sécurité").description("Problèmes de sécurité").build());
            categoryRepository.save(Category.builder().name("Autre").description("Autres problèmes").build());
        }
    }
}
