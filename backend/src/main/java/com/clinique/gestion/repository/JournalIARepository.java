package com.clinique.gestion.repository;

import com.clinique.gestion.entity.JournalIA;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JournalIARepository extends JpaRepository<JournalIA, Long> {
    List<JournalIA> findTop100ByOrderByDateAppelDesc();
    long countBySource(String source);
    long countBySuccesFalse();
}
