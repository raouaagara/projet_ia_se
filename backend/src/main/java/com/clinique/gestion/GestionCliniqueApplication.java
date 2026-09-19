package com.clinique.gestion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GestionCliniqueApplication {
    public static void main(String[] args) {
        SpringApplication.run(GestionCliniqueApplication.class, args);
    }
}
