package com.clinic;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Entity
@Table(name = "appointments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"doctor", "appointment_date", "slot"}))
public class Appointment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @NotBlank @Size(max = 100)
    public String patientName;

    @NotBlank @Pattern(regexp = "^[0-9+ -]{8,15}$", message = "Enter a valid phone number")
    public String phone;

    @NotBlank @Column(length = 100)
    public String doctor;

    @NotNull @Column(name = "appointment_date")
    public LocalDate appointmentDate;

    @NotBlank @Column(length = 10)
    public String slot;

    @Size(max = 300)
    public String reason;
}
