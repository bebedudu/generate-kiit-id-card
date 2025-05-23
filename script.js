const idForm = document.getElementById('idForm');
const idCard = document.getElementById('idCard');
const cardFront = document.getElementById('cardFront');
const cardBack = document.getElementById('cardBack');
const flipBtn = document.getElementById('flipBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const resetBtn = document.getElementById('resetBtn');
const previewBtn = document.getElementById('previewBtn');
const pdfBtn = document.getElementById('pdfBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const closeModal = document.querySelector('.close');
const themeToggle = document.getElementById('themeToggle');

// Track form completion
const formFields = [
  'photo', 'school', 'course', 'name', 'branch',
  'roll', 'studentNo', 'father', 'session', 'valid'
];

function updateProgress() {
  const totalFields = formFields.length;
  const filledFields = formFields.filter(field => {
    const element = document.getElementById(field);
    return element && element.value.trim() !== '';
  }).length;
  
  const progress = (filledFields / totalFields) * 100;
  progressBar.style.width = `${progress}%`;
  progressText.textContent = `${Math.round(progress)}% Complete`;
}

// Add input event listeners to all form fields
formFields.forEach(field => {
  const element = document.getElementById(field);
  if (element) {
    element.addEventListener('input', updateProgress);
  }
});

// Preview functionality
function showPreview() {
  if (!validateForm()) {
    alert('Please fill in all required fields before previewing.');
    return;
  }
  
  // Clone the card for preview
  const previewCard = idCard.cloneNode(true);
  previewContent.innerHTML = '';
  previewContent.appendChild(previewCard);
  
  // Show modal
  previewModal.style.display = 'block';
}

// Close modal when clicking the X or outside the modal
closeModal.onclick = function() {
  previewModal.style.display = 'none';
}

window.onclick = function(event) {
  if (event.target == previewModal) {
    previewModal.style.display = 'none';
  }
}

// PDF Export functionality
async function exportToPDF() {
  if (!validateForm()) {
    alert('Please fill in all required fields before exporting.');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Capture front of card
    const frontCanvas = await html2canvas(cardFront, {
      scale: 2,
      backgroundColor: null,
      logging: false
    });

    // --- Fix: Remove rotation before capturing back ---
    const backCardFace = cardBack;
    const originalTransform = backCardFace.style.transform;
    backCardFace.style.transform = 'none';

    // Wait for the browser to apply the style
    await new Promise(resolve => setTimeout(resolve, 50));

    // Capture back of card (now upright)
    const backCanvas = await html2canvas(backCardFace, {
      scale: 2,
      backgroundColor: null,
      logging: false
    });

    // Restore the original transform
    backCardFace.style.transform = originalTransform;

    // Add front of card to PDF
    const frontImgData = frontCanvas.toDataURL('image/png');
    pdf.addImage(frontImgData, 'PNG', 10, 10, 190, 285);

    // Add back of card to PDF
    const backImgData = backCanvas.toDataURL('image/png');
    pdf.addPage();
    pdf.addImage(backImgData, 'PNG', 10, 10, 190, 285);

    pdf.save('kiit-id-card.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  }
}

// Form validation
function validateForm() {
  return formFields.every(field => {
    const element = document.getElementById(field);
    return element && element.value.trim() !== '';
  });
}

// Add event listeners for new buttons
previewBtn.addEventListener('click', showPreview);
pdfBtn.addEventListener('click', exportToPDF);

// Update progress on page load
updateProgress();

// Add download button
const downloadBtn = document.createElement('button');
downloadBtn.id = 'downloadBtn';
downloadBtn.textContent = 'Download ID Card';
downloadBtn.style.display = 'none';
document.querySelector('.card-container').appendChild(downloadBtn);

// Function to save form data
function saveFormData() {
  const photoFile = document.getElementById('photo').files[0];
  if (!photoFile) {
    alert('Please select a profile photo before saving!');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const formData = {
      photo: event.target.result, // Store the base64 image data
      school: document.getElementById('school').value,
      course: document.getElementById('course').value,
      name: document.getElementById('name').value,
      branch: document.getElementById('branch').value,
      roll: document.getElementById('roll').value,
      studentNo: document.getElementById('studentNo').value,
      father: document.getElementById('father').value,
      session: document.getElementById('session').value,
      valid: document.getElementById('valid').value
    };

    // Save to localStorage
    try {
      localStorage.setItem('idCardData', JSON.stringify(formData));
      alert('Data saved successfully!');
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        alert('Storage limit exceeded! The image might be too large. Please try with a smaller image.');
      } else {
        alert('Error saving data: ' + e.message);
      }
    }
  };
  reader.readAsDataURL(photoFile);
}

// Function to load form data
function loadFormData() {
  const savedData = localStorage.getItem('idCardData');
  if (savedData) {
    try {
      const formData = JSON.parse(savedData);
      
      // Create a file input element to handle the image
      const photoInput = document.getElementById('photo');
      
      // Convert base64 to blob and create a file
      fetch(formData.photo)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
          
          // Create a new FileList object
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          photoInput.files = dataTransfer.files;
          
          // Trigger change event to update any preview
          const event = new Event('change', { bubbles: true });
          photoInput.dispatchEvent(event);
        });
      
      // Populate other form fields
      document.getElementById('school').value = formData.school;
      document.getElementById('course').value = formData.course;
      document.getElementById('name').value = formData.name;
      document.getElementById('branch').value = formData.branch;
      document.getElementById('roll').value = formData.roll;
      document.getElementById('studentNo').value = formData.studentNo;
      document.getElementById('father').value = formData.father;
      document.getElementById('session').value = formData.session;
      document.getElementById('valid').value = formData.valid;
      
      alert('Data loaded successfully!');
    } catch (e) {
      alert('Error loading data: ' + e.message);
    }
  } else {
    alert('No saved data found!');
  }
}

// Function to reset form
function resetForm() {
  if (confirm('Are you sure you want to reset the form? All entered data will be cleared.')) {
    idForm.reset();
    // Reset to default school value
    document.getElementById('school').value = 'School of Computer Engineering';
    // Reset to default course value
    document.getElementById('course').value = 'B.TECH';
    // Clear any generated ID card
    cardFront.innerHTML = '';
    cardBack.innerHTML = '';
    flipBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
  }
}

idForm.addEventListener('submit', function(e) {
  e.preventDefault();

  // Get form values
  const photoFile = document.getElementById('photo').files[0];
  const school = document.getElementById('school').value;
  const course = document.getElementById('course').value;
  const name = document.getElementById('name').value;
  const branch = document.getElementById('branch').value;
  const roll = document.getElementById('roll').value;
  const studentNo = document.getElementById('studentNo').value;
  const father = document.getElementById('father').value;
  const session = document.getElementById('session').value;
  const valid = document.getElementById('valid').value;

  // Read photo as data URL
  const reader = new FileReader();
  reader.onload = function(event) {
    const photoURL = event.target.result;

    // Front Side (pattern)
    cardFront.innerHTML = `
      <div class="pattern-box">
        <div>
          <div class="pattern-header-flex">
            <div class="pattern-logo-col">
              <img src="kiit.png" class="kiit-logo" alt="KIIT Logo">
            </div>
            <div class="pattern-univ-col">
              <div class="kiit-title">KALINGA INSTITUTE OF</div>
              <div class="kiit-title">INDUSTRIAL TECHNOLOGY</div>
              <div class="kiit-sub">Deemed to be University</div>
              <div class="kiit-uni">(Established U/S 3 of UGC Act, 1956)</div>
              <div class="kiit-uni">Bhubaneswar, Odisha, India</div>
            </div>
          </div>
          <div class="pattern-id">IDENTITY CARD</div>
          <div class="pattern-school">${school}</div>
          <div class="pattern-photo">
            <img src="${photoURL}" class="pattern-photo-img" alt="Profile Photo">
          </div>
          <div class="pattern-name">${name}</div>
          <div class="pattern-details">
            <div><span class="label">Course</span>: <span class="value">${course}</span></div>
            <div><span class="label">Branch</span>: <span class="value">${branch}</span></div>
            <div><span class="label">Roll No</span>: <span class="value">${roll}</span></div>
            <div><span class="label">Student No</span>: <span class="value">${studentNo}</span></div>
          </div>
        </div>
        <div class="pattern-sign">Director Gen</div>
      </div>
    `;

    // Back Side
    cardBack.innerHTML = `
      <div class="card-back-content">
        <div><span class="label">Father's Name</span> : <span class="value">${father}</span></div>
        <div><span class="label">Session</span> : <span class="value">${session}</span></div>
        <div><span class="label">Valid Upto</span> : <span class="value">${valid}</span></div>
        <div class="instructions">
          <b>INSTRUCTIONS</b>
          <ul>
            <li>Students can get books from the Library on production of this card.</li>
            <li>This card is only valid for the period mentioned above.</li>
            <li>Loss of the card should be informed immediately to the concerned authority.</li>
            <li>Duplicate card will be issued on payment of Rs.200/- after due verification.</li>
          </ul>
        </div>
        <div class="barcode">
          <svg id="barcodeSvg" class="barcode-img"></svg>
        </div>
        <div class="phfaxweb">
          Ph.: 0674 2742103, 2741747<br>
          Fax: (0674) 2741465, Website: www.kiit.ac.in
        </div>
      </div>
    `;
    // Generate the barcode using JsBarcode
    JsBarcode("#barcodeSvg", roll, {
      format: "CODE39",
      width: 2,
      height: 60,
      displayValue: true,
      margin: 0
    });

    flipBtn.style.display = 'block';
    downloadBtn.style.display = 'block';
    idCard.classList.remove('flipped');
    flipBtn.textContent = 'Flip Card';
  };
  reader.readAsDataURL(photoFile);
});

// Add download functionality
downloadBtn.addEventListener('click', async function() {
  const card = document.getElementById('idCard');
  const isFlipped = card.classList.contains('flipped');
  
  // If card is flipped, flip it back to front for download
  if (isFlipped) {
    card.classList.remove('flipped');
    flipBtn.textContent = 'Flip Card';
  }

  try {
    // Use html2canvas to capture the card
    const canvas = await html2canvas(card, {
      scale: 2, // Higher quality
      backgroundColor: null,
      logging: false
    });

    // Convert canvas to blob
    canvas.toBlob(function(blob) {
      // Create download link
      const link = document.createElement('a');
      link.download = 'kiit-id-card.png';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  } catch (error) {
    console.error('Error generating ID card:', error);
    alert('Error generating ID card. Please try again.');
  }
});

flipBtn.addEventListener('click', function() {
  idCard.classList.toggle('flipped');
  flipBtn.textContent = idCard.classList.contains('flipped') ? 'Show Front' : 'Flip Card';
});

// Add event listeners for the new buttons
saveBtn.addEventListener('click', saveFormData);
loadBtn.addEventListener('click', loadFormData);
resetBtn.addEventListener('click', resetForm);

// Theme toggle functionality
themeToggle.addEventListener('click', function() {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  themeToggle.textContent = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
});