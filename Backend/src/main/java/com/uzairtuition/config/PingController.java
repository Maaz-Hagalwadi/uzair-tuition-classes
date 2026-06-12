package com.uzairtuition.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class PingController {

    @GetMapping("/api/ping")
    public Map<String, String> ping() {
        return Map.of("status", "ok");
    }

    @RequestMapping(value = "/api/ping", method = RequestMethod.HEAD)
    public ResponseEntity<Void> pingHead() {
        return ResponseEntity.ok().build();
    }
}
