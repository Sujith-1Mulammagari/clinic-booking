package com.clinic;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctorAndAppointmentDate(String doctor, LocalDate appointmentDate);
    List<Appointment> findAllByOrderByAppointmentDateAscSlotAsc();
}
