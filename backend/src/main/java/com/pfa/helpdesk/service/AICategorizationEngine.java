package com.pfa.helpdesk.service;

import com.pfa.helpdesk.entity.Category;
import com.pfa.helpdesk.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AICategorizationEngine {

    private final CategoryRepository categoryRepository;

    /**
     * Moteur d'Intélligence Artificielle / NLP mocké pour deviner la catégorie 
     * en analysant les mots clés du titre et de la description.
     */
    public Category predictCategory(String title, String description) {
        String text = (title + " " + description).toLowerCase();

        // Analyseur de mots clés "AI"
        if (text.matches(".*(wifi|internet|connexion|réseau|vpn|ping|routeur|switch).*")) {
            return findExactCategory("Réseau");
        } 
        else if (text.matches(".*(pc|ordinateur|écran|souris|clavier|disque dur|ram|mémoire|surchauffe|matériel|serveur|imprimante).*")) {
            return findExactCategory("Matériel");
        } 
        else if (text.matches(".*(mot de passe|accès|sécurité|virus|piratage|hack|phishing|bloqué|compte).*")) {
            return findExactCategory("Sécurité");
        } 
        else if (text.matches(".*(logiciel|application|bug|erreur|excel|word|windows|office|installation|plantage|crash).*")) {
            return findExactCategory("Logiciel");
        }

        // Par défaut, s'il n'arrive pas à deviner, on met Matériel ou le premier trouvé (fallback)
        log.info("AI could not map text: [{}] to a specific category. Falling back to default.", title);
        List<Category> all = categoryRepository.findAll();
        return all.isEmpty() ? null : all.get(0);
    }

    private Category findExactCategory(String name) {
        Optional<Category> cat = categoryRepository.findByName(name);
        return cat.orElseGet(() -> {
            List<Category> all = categoryRepository.findAll();
            return all.isEmpty() ? null : all.get(0);
        });
    }
}
