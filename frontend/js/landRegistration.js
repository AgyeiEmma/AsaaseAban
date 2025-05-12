/**
 * Land Registration functionality for user page
 */

/**
 * Initialize the land registration form
 * @param {string} walletAddress - The user's wallet address
 * @param {function} refreshLandsCallback - Function to refresh the lands display after successful registration
 */
export function initLandRegistration(walletAddress, refreshLandsCallback) {
  const form = document.getElementById('landRegistrationForm');
  const statusDiv = document.getElementById('registrationStatus');
  
  if (!form) return;
  
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Show loading state
    const submitBtn = document.getElementById('registerBtn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    statusDiv.innerHTML = '<p class="info-message">Uploading document and registering land...</p>';
    
    try {
      // Get form values
      const location = document.getElementById('landLocation').value;
      const documentFile = document.getElementById('documentFile').files[0];
      const description = document.getElementById('landDescription').value || '';
      
      if (!location || !documentFile) {
        throw new Error('Please provide both location coordinates and a document file');
      }
      
      // Create form data object for file upload
      const formData = new FormData();
      formData.append('document', documentFile);
      formData.append('location', location);
      formData.append('description', description);
      formData.append('owner', walletAddress);
      
      // Submit to backend
      const response = await fetch('http://localhost:8000/api/lands/register', {
        method: 'POST',
        body: formData, // FormData automatically sets content-type to multipart/form-data
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register land');
      }
      
      const data = await response.json();
      
      // Show success message
      statusDiv.innerHTML = `
        <div class="success-message">
          <p><i class="fas fa-check-circle"></i> Land registration submitted successfully!</p>
          <p>Your submission will be reviewed by an admin.</p>
          <p>Submission ID: ${data.submissionId || 'N/A'}</p>
        </div>
      `;
      
      // Reset form
      form.reset();
      
      // If a callback was provided to refresh the lands view, call it
      if (typeof refreshLandsCallback === 'function') {
        // Add a slight delay before refreshing to show the success message
        setTimeout(() => {
          refreshLandsCallback(walletAddress);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error registering land:', error);
      statusDiv.innerHTML = `
        <div class="error-message">
          <p><i class="fas fa-exclamation-triangle"></i> ${error.message}</p>
        </div>
      `;
    } finally {
      // Restore button state
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });
  
  // Add a function to show pending submissions
  fetchPendingSubmissions(walletAddress);
}

/**
 * Fetch pending land registration submissions for this user
 * @param {string} walletAddress - The user's wallet address
 */
async function fetchPendingSubmissions(walletAddress) {
  try {
    const response = await fetch(`http://localhost:8000/api/lands/pending/${walletAddress}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch pending submissions');
    }
    
    const submissions = await response.json();
    
    // If there are pending submissions, display them
    if (submissions.length > 0) {
      const myLandsContainer = document.getElementById('myLandsContainer');
      
      // Create a separate container for pending submissions
      let pendingSection = document.getElementById('pendingSubmissionsSection');
      
      if (!pendingSection) {
        pendingSection = document.createElement('div');
        pendingSection.id = 'pendingSubmissionsSection';
        pendingSection.className = 'pending-submissions-section';
        pendingSection.innerHTML = '<h3>Pending Submissions</h3>';
        myLandsContainer.prepend(pendingSection);
      }
      
      const submissionsList = document.createElement('div');
      submissionsList.className = 'pending-submissions-list';
      
      submissions.forEach(submission => {
        const submissionItem = document.createElement('div');
        submissionItem.className = 'pending-submission-item';
        submissionItem.innerHTML = `
          <div class="submission-header">
            <h4>Submission #${submission.id}</h4>
            <span class="submission-status ${submission.status}">${submission.status}</span>
          </div>
          <p><strong>Location:</strong> ${submission.location}</p>
          <p><strong>Submitted:</strong> ${new Date(submission.created_at).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${
            submission.status === 'pending' ? 'Waiting for admin approval' :
            submission.status === 'approved' ? 'Approved! Land will appear in your lands soon.' :
            'Rejected. Please submit again with valid information.'
          }</p>
        `;
        
        submissionsList.appendChild(submissionItem);
      });
      
      pendingSection.appendChild(submissionsList);
    }
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
  }
}

// Export additional functions as needed