import { useEffect, useState } from "react";
import "./styles.css";

async function api(path, options = {}) {
  const res = await fetch("/api" + path, options);
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try { message = (await res.json()).message || message; } catch { /* no body */ }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

const today = () => new Date().toISOString().slice(0, 10);

function Book() {
  const empty = { patientName: "", phone: "", doctor: "", appointmentDate: today(), slot: "", reason: "" };
  const [form, setForm] = useState(empty);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api("/doctors").then((d) => { setDoctors(d); set("doctor", d[0] || ""); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!form.doctor || !form.appointmentDate) return;
    set("slot", "");
    const q = new URLSearchParams({ doctor: form.doctor, date: form.appointmentDate });
    api("/slots?" + q).then(setSlots).catch((e) => setError(e.message));
  }, [form.doctor, form.appointmentDate]);

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const saved = await api("/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setDone(saved);
      setForm({ ...empty, doctor: form.doctor });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card">
        <h2>Appointment booked</h2>
        <p>{done.patientName}, you are booked with {done.doctor} on {done.appointmentDate} at {done.slot}.</p>
        <p className="muted">Please arrive 10 minutes early. Booking reference: #{done.id}</p>
        <button className="primary" onClick={() => setDone(null)}>Book another appointment</button>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <label htmlFor="n">Patient name</label>
      <input id="n" required maxLength={100} value={form.patientName} onChange={(e) => set("patientName", e.target.value)} />
      <label htmlFor="p">Phone number</label>
      <input id="p" required inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      <label htmlFor="d">Doctor</label>
      <select id="d" value={form.doctor} onChange={(e) => set("doctor", e.target.value)}>
        {doctors.map((d) => <option key={d}>{d}</option>)}
      </select>
      <label htmlFor="dt">Date</label>
      <input id="dt" type="date" min={today()} required value={form.appointmentDate} onChange={(e) => set("appointmentDate", e.target.value)} />
      <label>Available times</label>
      <div className="slots">
        {slots.length === 0 && <span className="muted">No free times on this date. Try another day.</span>}
        {slots.map((s) => (
          <button type="button" key={s} className={form.slot === s ? "on" : ""} onClick={() => set("slot", s)}>{s}</button>
        ))}
      </div>
      <label htmlFor="r">Reason for visit (optional)</label>
      <textarea id="r" rows={3} maxLength={300} value={form.reason} onChange={(e) => set("reason", e.target.value)} />
      {error && <div className="msg err">{error}</div>}
      <button className="primary" disabled={busy || !form.slot}>{busy ? "Booking..." : "Confirm appointment"}</button>
    </form>
  );
}

function Admin() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  const headers = { "X-Admin-Key": key };
  const load = () =>
    api("/admin/appointments", { headers })
      .then((r) => { setRows(r); setError(""); })
      .catch((e) => { setRows(null); setError(e.message); });

  async function cancel(id) {
    if (!window.confirm("Cancel this appointment?")) return;
    try { await api("/admin/appointments/" + id, { method: "DELETE", headers }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <div className="card">
      <label htmlFor="k">Admin key</label>
      <input id="k" type="password" value={key} onChange={(e) => setKey(e.target.value)} />
      <button className="primary" onClick={load} disabled={!key}>View appointments</button>
      {error && <div className="msg err">{error}</div>}
      {rows && rows.length === 0 && <p className="muted">No appointments yet.</p>}
      {rows && rows.length > 0 && (
        <div className="scroll">
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Patient</th><th>Phone</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.appointmentDate}</td><td>{r.slot}</td><td>{r.doctor}</td>
                  <td>{r.patientName}{r.reason && <div className="muted">{r.reason}</div>}</td>
                  <td>{r.phone}</td>
                  <td><button className="del" onClick={() => cancel(r.id)}>Cancel</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("book");
  return (
    <>
      <header>
        <h1>City Care Clinic</h1>
        <p>Book your visit online. No calls, no waiting.</p>
      </header>
      <nav>
        <button className={tab === "book" ? "on" : ""} onClick={() => setTab("book")}>Book appointment</button>
        <button className={tab === "admin" ? "on" : ""} onClick={() => setTab("admin")}>Clinic staff</button>
      </nav>
      <main>{tab === "book" ? <Book /> : <Admin />}</main>
    </>
  );
}
