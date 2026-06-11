package com.uzairtuition;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class UzairTuitionApplication {

    public static void main(String[] args) {
        SpringApplication.run(UzairTuitionApplication.class, args);
    }
}
