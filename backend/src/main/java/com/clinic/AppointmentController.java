package com.clinic;

import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AppointmentController {

    static final List<String> DOCTORS = List.of(
        "Dr. Anita Rao - General Physician",
        "Dr. Ravi Kumar - Pediatrics",
        "Dr. Meena Shah - Dermatology");

    static final List<String> SLOTS = List.of(
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30");

    private final AppointmentRepository repo;

    @Value("${app.admin-key}")
    private String adminKey;

    public AppointmentController(AppointmentRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/doctors")
    public List<String> doctors() {
        return DOCTORS;
    }

    @GetMapping("/slots")
    public List<String> freeSlots(@RequestParam String doctor,
                                  @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Set<String> taken = repo.findByDoctorAndAppointmentDate(doctor, date).stream()
            .map(a -> a.slot).collect(Collectors.toSet());
        return SLOTS.stream().filter(s -> !taken.contains(s)).toList();
    }

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public Appointment book(@Valid @RequestBody Appointment a) {
        if (!DOCTORS.contains(a.doctor) || !SLOTS.contains(a.slot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid doctor and time slot.");
        }
        if (a.appointmentDate.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose today or a future date.");
        }
        a.id = null;
        try {
            return repo.saveAndFlush(a);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That slot was just taken. Pick another time.");
        }
    }

    @GetMapping("/admin/appointments")
    public List<Appointment> all(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        auth(key);
        return repo.findAllByOrderByAppointmentDateAscSlotAsc();
    }

    @DeleteMapping("/admin/appointments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable Long id,
                       @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        auth(key);
        repo.deleteById(id);
    }

    private void auth(String key) {
        boolean ok = key != null && MessageDigest.isEqual(
            key.getBytes(StandardCharsets.UTF_8), adminKey.getBytes(StandardCharsets.UTF_8));
        if (!ok) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong admin key.");
    }
}
