document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants HTML with delete buttons
        let participantsHTML = "";
        if (details.participants && details.participants.length > 0) {
          participantsHTML = `<div class="participants">
            <strong>Participants:</strong>
            <ul>
              ${details.participants
                .map(
                  p =>
                    `<li>${p}<button class="remove-btn" data-activity="${name}" data-email="${p}" title="Unregister">&times;</button></li>`
                )
                .join("")}
            </ul>
          </div>`;
        } else {
          participantsHTML = `<div class="participants empty"><em>No one has signed up yet.</em></div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh list so new participant shows up immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // delegate remove button clicks
  activitiesList.addEventListener("click", async (evt) => {
    if (evt.target.classList.contains("remove-btn")) {
      const act = evt.target.dataset.activity;
      const email = evt.target.dataset.email;
      try {
        const resp = await fetch(
          `/activities/${encodeURIComponent(act)}/signup?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        const resj = await resp.json();
        if (resp.ok) {
          messageDiv.textContent = resj.message;
          messageDiv.className = "info";
          fetchActivities();
        } else {
          messageDiv.textContent = resj.detail || "Unable to unregister";
          messageDiv.className = "error";
        }
      } catch (err) {
        messageDiv.textContent = "Request failed.";
        messageDiv.className = "error";
        console.error(err);
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  });

  // Initialize app
  fetchActivities();
});
