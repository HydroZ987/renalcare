// patient-appointments.js - Gestion des rendez-vous pour le dashboard patient

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que l'utilisateur est connecté et est un patient
    const userName = localStorage.getItem('user_name');
    const userRole = localStorage.getItem('user_role');
    const userId = localStorage.getItem('user_id');

    if (!userName || userRole !== 'patient') {
        return;
    }

    // Charger les rendez-vous à venir et passés
    loadAppointments();

    // Event listener for "Nouveau RDV" button
    const newRdvBtn = document.querySelector('.header-right .btn-primary');
    if (newRdvBtn) {
        newRdvBtn.addEventListener('click', openNewAppointmentModal);
    }

    // Create modal if it doesn't exist
    createAppointmentModal();
});

function createAppointmentModal() {
    if (document.getElementById('appointmentModal')) return;

    const modal = document.createElement('div');
    modal.id = 'appointmentModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Nouveau Rendez-vous</h2>
                <button class="modal-close" onclick="closeAppointmentModal()">×</button>
            </div>
            <form id="appointmentForm">
                <div class="form-group">
                    <label for="appointmentDate">Date et Heure</label>
                    <input type="datetime-local" id="appointmentDate" required>
                </div>
                <div class="form-group">
                    <label for="appointmentDoctor">Médecin</label>
                    <select id="appointmentDoctor" required>
                        <option value="">Choisir un médecin...</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="closeAppointmentModal()">Annuler</button>
                    <button type="submit" class="btn-primary">Enregistrer</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Load doctors into dropdown
    loadDoctorsForDropdown();

    // Handle form submission
    document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentSubmit);
}

async function loadDoctorsForDropdown() {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/patients/doctors/list', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Doctors response:', data);

        if (data.success && data.doctors && data.doctors.length > 0) {
            const select = document.getElementById('appointmentDoctor');
            data.doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `Dr. ${doctor.prenom} ${doctor.nom}`;
                select.appendChild(option);
            });
        } else {
            console.warn('No doctors found or error:', data);
            const select = document.getElementById('appointmentDoctor');
            if (select) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Aucun médecin disponible';
                option.disabled = true;
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Erreur chargement médecins:', error);
        const select = document.getElementById('appointmentDoctor');
        if (select) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Erreur lors du chargement';
            option.disabled = true;
            select.appendChild(option);
        }
    }
}

function openNewAppointmentModal() {
    document.getElementById('modalTitle').textContent = 'Nouveau Rendez-vous';
    document.getElementById('appointmentForm').reset();
    document.getElementById('appointmentForm').dataset.appointmentId = '';

    // Reset doctor dropdown and reload doctors
    const doctorSelect = document.getElementById('appointmentDoctor');
    doctorSelect.innerHTML = '<option value="">Choisir un médecin...</option>';
    loadDoctorsForDropdown();

    document.getElementById('appointmentModal').classList.add('active');
}

function closeAppointmentModal() {
    document.getElementById('appointmentModal').classList.remove('active');
}

async function loadAppointments() {
    try {
        const userId = localStorage.getItem('user_id');
        const token = localStorage.getItem('auth_token');

        if (!userId) {
            console.error('User ID not found');
            return;
        }

        // Fetch upcoming appointments
        const upcomingRes = await fetch(`/api/patients/appointments/upcoming?user_id=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Fetch past appointments
        const pastRes = await fetch(`/api/patients/appointments/past?user_id=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const upcomingData = await upcomingRes.json();
        const pastData = await pastRes.json();

        if (upcomingData.success) {
            renderUpcomingAppointments(upcomingData.appointments);
        }

        if (pastData.success) {
            renderPastAppointments(pastData.appointments);
        }

    } catch (error) {
        console.error('Erreur chargement rendez-vous:', error);
        showErrorMessage('upcomingAppointments', 'Erreur lors du chargement des rendez-vous à venir');
        showErrorMessage('pastAppointments', 'Erreur lors du chargement des rendez-vous passés');
    }
}

function renderUpcomingAppointments(appointments) {
    const container = document.getElementById('upcomingAppointments');
    if (!container) return;

    if (!appointments || appointments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Aucun rendez-vous à venir</p>';
        return;
    }

    container.innerHTML = appointments.map(apt => {
        const date = new Date(apt.date);
        const monthName = date.toLocaleString('fr-FR', { month: 'short' });
        const day = date.getDate();
        const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const doctorName = `Dr. ${apt.nom}`;

        return `
      <div class="appointment-card">
        <div class="appointment-date">
          <div class="date-month">${monthName}</div>
          <div class="date-day">${day}</div>
          <div class="date-time">${time}</div>
        </div>
        <div class="appointment-details">
          <h3>${doctorName}</h3>
          <div class="appointment-type">Consultation de suivi</div>
          <div class="appointment-info">
            <div class="info-item">
              <span>👤</span>
              <span>${apt.prenom} ${apt.nom}</span>
            </div>
            <div class="info-item">
              <span>📧</span>
              <span>${apt.email}</span>
            </div>
            <div class="info-item">
              <span>📋</span>
              <span>Statut: ${apt.statut || 'Confirmé'}</span>
            </div>
          </div>
        </div>
        <div class="appointment-actions">
          <button class="btn-action" onclick="editAppointment(${apt.id})">Modifier</button>
          <button class="btn-cancel" onclick="cancelAppointment(${apt.id})">Annuler</button>
        </div>
      </div>
    `;
    }).join('');
}

function renderPastAppointments(appointments) {
    const container = document.getElementById('pastAppointments');
    if (!container) return;

    if (!appointments || appointments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Aucun rendez-vous passé</p>';
        return;
    }

    container.innerHTML = appointments.map(apt => {
        const date = new Date(apt.date);
        const monthName = date.toLocaleString('fr-FR', { month: 'short' });
        const day = date.getDate();
        const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const doctorName = `Dr. ${apt.nom}`;

        return `
      <div class="appointment-card">
        <div class="appointment-date">
          <div class="date-month">${monthName}</div>
          <div class="date-day">${day}</div>
          <div class="date-time">${time}</div>
        </div>
        <div class="appointment-details">
          <h3>${doctorName}</h3>
          <div class="appointment-type">Consultation de suivi</div>
          <div class="appointment-info">
            <div class="info-item">
              <span>✓</span>
              <span>Rendez-vous effectué</span>
            </div>
            <div class="info-item">
              <span>📋</span>
              <span>Statut: ${apt.statut || 'Complété'}</span>
            </div>
          </div>
        </div>
        <div class="appointment-actions">
          <button class="btn-action" onclick="viewAppointmentDetails(${apt.id})">Voir le compte-rendu</button>
        </div>
      </div>
    `;
    }).join('');
}

function showErrorMessage(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<p style="text-align: center; color: #d32f2f; padding: 40px;">${message}</p>`;
    }
}

// Placeholder functions for appointment actions
async function handleAppointmentSubmit(event) {
    event.preventDefault();

    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('auth_token');
    const appointmentId = document.getElementById('appointmentForm').dataset.appointmentId;

    // Get the datetime-local value and convert it properly
    const dateTimeLocal = document.getElementById('appointmentDate').value;

    // datetime-local format: "2025-01-15T14:30"
    // We need to send it as-is to the backend, which will handle timezone conversion
    const appointmentData = {
        user_id: userId,
        date: dateTimeLocal,
        id_utilisateur_medecin: document.getElementById('appointmentDoctor').value,
        statut: 'En attente' // Always set to pending for new appointments
    };

    try {
        let url, method;
        if (appointmentId) {
            // Update existing appointment
            url = `/api/patients/appointments/${appointmentId}`;
            method = 'PUT';
        } else {
            // Create new appointment
            url = '/api/patients/appointments/create';
            method = 'POST';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message || 'Rendez-vous enregistré avec succès');
            closeAppointmentModal();
            loadAppointments(); // Reload appointments
        } else {
            alert('Erreur: ' + (data.error || 'Impossible d\'enregistrer le rendez-vous'));
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'enregistrement du rendez-vous');
    }
}

async function editAppointment(appointmentId) {
    try {
        const userId = localStorage.getItem('user_id');
        const token = localStorage.getItem('auth_token');

        // Fetch appointment details from backend
        const response = await fetch(`/api/patients/appointments/${appointmentId}?user_id=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            alert('Impossible de charger les détails du rendez-vous');
            return;
        }

        const data = await response.json();

        if (!data.success || !data.appointment) {
            alert('Rendez-vous non trouvé');
            return;
        }

        const apt = data.appointment;

        // Open modal for editing
        document.getElementById('modalTitle').textContent = 'Modifier Rendez-vous';
        document.getElementById('appointmentForm').dataset.appointmentId = appointmentId;

        // Convert UTC date to local datetime-local format
        const date = new Date(apt.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const datetimeLocalValue = `${year}-${month}-${day}T${hours}:${minutes}`;

        document.getElementById('appointmentDate').value = datetimeLocalValue;
        document.getElementById('appointmentDoctor').value = apt.id_utilisateur_medecin;

        document.getElementById('appointmentModal').classList.add('active');
    } catch (error) {
        console.error('Erreur chargement rendez-vous:', error);
        alert('Erreur lors du chargement du rendez-vous');
    }
}

async function cancelAppointment(appointmentId) {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
        return;
    }

    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('auth_token');

    try {
        const response = await fetch(`/api/patients/appointments/${appointmentId}?user_id=${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message || 'Rendez-vous annulé avec succès');
            loadAppointments(); // Reload appointments
        } else {
            alert('Erreur: ' + (data.error || 'Impossible d\'annuler le rendez-vous'));
        }
    } catch (error) {
        console.error('Erreur annulation:', error);
        alert('Erreur lors de l\'annulation du rendez-vous');
    }
}

function viewAppointmentDetails(appointmentId) {
    console.log('Viewing appointment details:', appointmentId);
    alert('Détails du rendez-vous ' + appointmentId + ' - Fonctionnalité à implémenter');
}
