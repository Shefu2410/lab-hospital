// admin-approve.js
// Functions to load pending labs and approve/reject them.
// Change API_BASE to match your backend URL.

const API_BASE = "https://lab-hospital-backend.onrender.com/api/admin";


// Loads the list of pending labs from the server
async function loadPendingLabs() {
  const response = await fetch(API_BASE + "/pending-labs");
  const data = await response.json();

  if (data.success === false) {
    console.log("Error loading labs:", data.message);
    return;
  }

  showLabs(data.labs);
}


// Takes the list of labs and builds the HTML for each one
function showLabs(labs) {
  const container = document.getElementById("content");

  // clear old content first
  container.innerHTML = "";

  if (labs.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No pending labs right now.";
    container.appendChild(emptyMessage);
    return;
  }

  for (let i = 0; i < labs.length; i++) {
    const lab = labs[i];
    const card = buildLabCard(lab);
    container.appendChild(card);
  }
}


// Builds one lab card (name, email, approve button, reject button)
function buildLabCard(lab) {
  const card = document.createElement("div");
  card.className = "card";

  const nameEl = document.createElement("h3");
  nameEl.textContent = lab.labName;

  const emailEl = document.createElement("p");
  emailEl.textContent = lab.email;

  const approveBtn = document.createElement("button");
  approveBtn.textContent = "Approve";
  approveBtn.onclick = function () {
    approveLab(lab._id);
  };

  const rejectBtn = document.createElement("button");
  rejectBtn.textContent = "Reject";
  rejectBtn.onclick = function () {
    rejectLab(lab._id);
  };

  card.appendChild(nameEl);
  card.appendChild(emailEl);
  card.appendChild(approveBtn);
  card.appendChild(rejectBtn);

  return card;
}


// Approves a lab and shows the new lab code
async function approveLab(labId) {
  const response = await fetch(API_BASE + "/approve-lab/" + labId, {
    method: "POST"
  });
  const data = await response.json();

  if (data.success === false) {
    alert("Could not approve: " + data.message);
    return;
  }

  alert("Approved! Lab code is: " + data.labCode);

  // refresh the list so the approved lab disappears
  loadPendingLabs();
}


// Rejects a lab
async function rejectLab(labId) {
  const confirmed = confirm("Reject this lab?");
  if (!confirmed) {
    return;
  }

  const response = await fetch(API_BASE + "/reject-lab/" + labId, {
    method: "POST"
  });
  const data = await response.json();

  if (data.success === false) {
    alert("Could not reject: " + data.message);
    return;
  }

  loadPendingLabs();
}


// Run this when the page loads
loadPendingLabs();