/**
 * Admin functionality for managing land submissions
 */

// State management for submissions
let currentPage = 1;
let itemsPerPage = 10;
let currentStatus = "pending";
let currentSearchTerm = "";
let totalSubmissions = 0;
let activeSubmission = null;

/**
 * Initialize the land submissions management functionality
 */
export function initAdminSubmissions() {
  console.log("Initializing admin submissions module...");

  // Set up references to DOM elements
  const statusFilter = document.getElementById("submissionStatus");
  const searchInput = document.getElementById("submissionSearch");
  const submissionsContainer = document.getElementById("submissionsContainer");
  const paginationContainer = document.getElementById("submissionsPagination");
  const submissionsLoader = document.getElementById("submissionsLoader");
  const modal = document.getElementById("submissionModal");
  const modalBody = document.getElementById("submissionModalBody");
  const closeModalBtn = document.querySelector(".close-modal");
  const approveBtn = document.getElementById("approveSubmissionBtn");
  const rejectBtn = document.getElementById("rejectSubmissionBtn");
  const adminNotes = document.getElementById("adminNotes");

  // Set up event listeners
  if (statusFilter) {
    statusFilter.addEventListener("change", function () {
      currentStatus = this.value;
      currentPage = 1;
      loadSubmissions();
    });
  }

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce(function () {
        currentSearchTerm = this.value;
        currentPage = 1;
        loadSubmissions();
      }, 300)
    );
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", function () {
      if (modal) {
        modal.style.display = "none";
        document.body.classList.remove("modal-open");
        activeSubmission = null;
      }
    });
  }

  if (approveBtn) {
    approveBtn.addEventListener("click", function () {
      handleApprovalAction("approved");
    });
  }

  if (rejectBtn) {
    rejectBtn.addEventListener("click", function () {
      handleApprovalAction("rejected");
    });
  }

  // Initial load of submissions
  loadSubmissions();

  // Make these functions available globally for event handlers
  window.viewSubmissionDetails = viewSubmissionDetails;
  window.resetFilters = resetFilters;
  window.goToPage = goToPage;
  window.previousPage = previousPage;
  window.nextPage = nextPage;

  /**
   * Load submissions based on current filters and pagination
   */
  function loadSubmissions() {
    if (!submissionsContainer) return;

    // Show loader
    if (submissionsLoader) {
      submissionsLoader.style.display = "flex";
    }
    submissionsContainer.innerHTML = "";

    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage,
      limit: itemsPerPage,
      status: currentStatus !== "all" ? currentStatus : "",
      search: currentSearchTerm,
    });

    fetch(`http://localhost:8000/api/admin/submissions?${params.toString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load submissions");
        }
        return response.json();
      })
      .then((data) => {
        totalSubmissions = data.total || 0;

        // Hide loader
        if (submissionsLoader) {
          submissionsLoader.style.display = "none";
        }

        if (data.submissions.length === 0) {
          submissionsContainer.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-search"></i>
              <p>No submissions found matching your filters</p>
              <button class="reset-filters-btn" onclick="resetFilters()">
                Reset Filters
              </button>
            </div>
          `;
          if (paginationContainer) {
            paginationContainer.innerHTML = "";
          }
          return;
        }

        // Render submissions
        renderSubmissions(data.submissions);

        // Update pagination
        updatePagination();
      })
      .catch((error) => {
        console.error("Error loading submissions:", error);
        if (submissionsLoader) {
          submissionsLoader.style.display = "none";
        }
        submissionsContainer.innerHTML = `
          <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error loading submissions: ${error.message}</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        `;
      });
  }

  /**
   * Render submissions to the container
   */
  function renderSubmissions(submissions) {
    const submissionsList = document.createElement("div");
    submissionsList.className = "submissions-list";

    submissions.forEach((submission) => {
      const submissionItem = document.createElement("div");
      submissionItem.className = `submission-item ${submission.status}`;
      submissionItem.dataset.id = submission.id;

      const submissionDate = new Date(
        submission.created_at
      ).toLocaleDateString();

      submissionItem.innerHTML = `
        <div class="submission-header">
          <span class="submission-id">#${submission.id}</span>
          <span class="submission-status ${submission.status}">
            ${
              submission.status.charAt(0).toUpperCase() +
              submission.status.slice(1)
            }
          </span>
        </div>
        <div class="submission-body">
          <div class="submission-info">
            <p><strong>Location:</strong> ${submission.location}</p>
            <p><strong>Owner:</strong> ${truncateWalletAddress(
              submission.owner_wallet
            )}</p>
            <p><strong>Submitted:</strong> ${submissionDate}</p>
          </div>
        </div>
        <div class="submission-footer">
          <button class="view-details-btn" data-id="${submission.id}">
            <i class="fas fa-eye"></i> View Details
          </button>
        </div>
      `;

      // Add click event to view submission details
      const viewBtn = submissionItem.querySelector(".view-details-btn");
      if (viewBtn) {
        viewBtn.addEventListener("click", function () {
          viewSubmissionDetails(submission.id);
        });
      }

      submissionsList.appendChild(submissionItem);
    });

    submissionsContainer.appendChild(submissionsList);
  }

  /**
   * View submission details in modal
   */
  function viewSubmissionDetails(submissionId) {
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i> Loading submission details...
      </div>
    `;

    modal.style.display = "block";
    document.body.classList.add("modal-open");

    fetch(`http://localhost:8000/api/admin/submissions/${submissionId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load submission details");
        }
        return response.json();
      })
      .then((submission) => {
        activeSubmission = submission;

        // Update admin notes field
        if (adminNotes) {
          adminNotes.value = submission.admin_notes || "";
        }

        // Enable/disable approval buttons based on status
        if (submission.status !== "pending") {
          if (approveBtn) approveBtn.disabled = true;
          if (rejectBtn) rejectBtn.disabled = true;
        } else {
          if (approveBtn) approveBtn.disabled = false;
          if (rejectBtn) rejectBtn.disabled = false;
        }

        // Format dates
        const submittedDate = new Date(submission.created_at).toLocaleString();
        const updatedDate = submission.updated_at
          ? new Date(submission.updated_at).toLocaleString()
          : "N/A";

        // Render submission details
        modalBody.innerHTML = `
          <div class="submission-detail">
            <h3>Submission #${submission.id} 
              <span class="submission-status ${submission.status}">
                ${
                  submission.status.charAt(0).toUpperCase() +
                  submission.status.slice(1)
                }
              </span>
            </h3>
            
            <div class="detail-section">
              <h4>Land Information</h4>
              <p><strong>Location:</strong> ${submission.location}</p>
              <p><strong>Description:</strong> ${
                submission.description || "No description provided"
              }</p>
            </div>
            
            <div class="detail-section">
              <h4>Owner Information</h4>
              <p><strong>Wallet Address:</strong> ${submission.owner_wallet}</p>
            </div>
            
            <div class="detail-section">
              <h4>Document</h4>
              <div class="document-preview">
                ${getDocumentPreviewHtml(submission.document_path)}
                <a href="http://localhost:8000/api/documents/${encodeURIComponent(
                  getFilenameFromPath(submission.document_path)
                )}" 
                   target="_blank" class="download-btn">
                  <i class="fas fa-download"></i> Download Document
                </a>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>Submission Details</h4>
              <p><strong>Submitted:</strong> ${submittedDate}</p>
              <p><strong>Last Updated:</strong> ${updatedDate}</p>
              ${
                submission.reviewed_by
                  ? `<p><strong>Reviewed By:</strong> ${submission.reviewed_by}</p>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .catch((error) => {
        console.error("Error loading submission details:", error);
        modalBody.innerHTML = `
          <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error loading submission details: ${error.message}</p>
            <button onclick="viewSubmissionDetails(${submissionId})">Try Again</button>
          </div>
        `;
      });
  }

  /**
   * Handle approval or rejection of a submission
   */
  function handleApprovalAction(action) {
    if (!activeSubmission || !modalBody) return;

    // Disable buttons to prevent double submission
    if (approveBtn) approveBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;

    // Update button text to show loading
    const actionBtn = action === "approved" ? approveBtn : rejectBtn;
    const originalBtnText = actionBtn.innerHTML;
    actionBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;

    // Get admin wallet from localStorage
    const adminWallet = localStorage.getItem("walletAddress");

    fetch(
      `http://localhost:8000/api/admin/submissions/${activeSubmission.id}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: action,
          adminNotes: adminNotes ? adminNotes.value : "",
          reviewedBy: adminWallet,
        }),
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update submission status");
        }
        return response.json();
      })
      .then((result) => {
        // Display success message in modal
        modalBody.innerHTML = `
          <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <h3>Success!</h3>
            <p>The submission has been ${action}.</p>
            ${
              action === "approved"
                ? "<p>The land has been added to the database.</p>"
                : ""
            }
          </div>
        `;

        // Reload submissions after a short delay
        setTimeout(() => {
          if (modal) {
            modal.style.display = "none";
            document.body.classList.remove("modal-open");
          }
          activeSubmission = null;
          loadSubmissions();
        }, 2000);
      })
      .catch((error) => {
        console.error(
          `Error ${
            action === "approved" ? "approving" : "rejecting"
          } submission:`,
          error
        );

        // Display error message but keep modal open
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.innerHTML = `
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error: ${error.message}</p>
        `;

        modalBody.appendChild(errorDiv);

        // Re-enable buttons
        if (approveBtn) approveBtn.disabled = false;
        if (rejectBtn) rejectBtn.disabled = false;
      })
      .finally(() => {
        // Restore button text
        actionBtn.innerHTML = originalBtnText;
      });
  }

  /**
   * Update pagination controls
   */
  function updatePagination() {
    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalSubmissions / itemsPerPage);

    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    let paginationHtml = "";

    // Previous button
    paginationHtml += `
      <button class="pagination-btn prev-btn ${
        currentPage === 1 ? "disabled" : ""
      }"
        ${currentPage === 1 ? "disabled" : ""} onclick="previousPage()">
        <i class="fas fa-chevron-left"></i>
      </button>
    `;

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `
        <button class="pagination-btn page-number ${
          i === currentPage ? "active" : ""
        }" 
          onclick="goToPage(${i})">
          ${i}
        </button>
      `;
    }

    // Next button
    paginationHtml += `
      <button class="pagination-btn next-btn ${
        currentPage === totalPages ? "disabled" : ""
      }"
        ${currentPage === totalPages ? "disabled" : ""} onclick="nextPage()">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    paginationContainer.innerHTML = paginationHtml;
  }

  /**
   * Reset all filters
   */
  function resetFilters() {
    currentStatus = "pending";
    currentSearchTerm = "";
    currentPage = 1;

    if (statusFilter) statusFilter.value = currentStatus;
    if (searchInput) searchInput.value = "";

    loadSubmissions();
  }

  /**
   * Pagination navigation functions
   */
  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
      loadSubmissions();
    }
  }

  function nextPage() {
    const totalPages = Math.ceil(totalSubmissions / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      loadSubmissions();
    }
  }

  function goToPage(page) {
    currentPage = page;
    loadSubmissions();
  }
}

/**
 * Get HTML for document preview based on file type
 */
function getDocumentPreviewHtml(documentPath) {
  if (!documentPath) return "<p>No document available</p>";

  const ext = documentPath.split(".").pop().toLowerCase();
  const filename = getFilenameFromPath(documentPath);
  const documentUrl = `http://localhost:8000/api/documents/${encodeURIComponent(
    filename
  )}`;

  if (["jpg", "jpeg", "png"].includes(ext)) {
    return `<img src="${documentUrl}" alt="Land document" class="document-image">`;
  } else if (ext === "pdf") {
    return `
      <div class="pdf-preview">
        <i class="fas fa-file-pdf"></i>
        <p>PDF Document</p>
      </div>
    `;
  } else {
    return `
      <div class="document-icon">
        <i class="fas fa-file"></i>
        <p>Document</p>
      </div>
    `;
  }
}

/**
 * Extract filename from path
 */
function getFilenameFromPath(path) {
  if (!path) return "";
  return path.split(/[\\/]/).pop();
}

/**
 * Helper function to truncate wallet addresses
 */
function truncateWalletAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
}

/**
 * Debounce function to limit how often a function can run
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
