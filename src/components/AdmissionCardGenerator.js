// ============================================
// FILE: components/AdmissionCardGenerator.js (FIXED)
// ============================================
'use client';

import jsPDF from 'jspdf';

const AdmissionCardGenerator = ({ registration, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      // Convert 24hr to 12hr format
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (err) {
      return timeString;
    }
  };

  const generatePDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ===== SINGLE BLACK BORDER =====
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // ===== HEADER SECTION =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('SIPSARA INSTITUTE', pageWidth / 2, 30, { align: 'center' });

    // Admission Card title with underline
    let yPos = 50;
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ADMISSION CARD', pageWidth / 2, yPos, { align: 'center' });
    
    // Decorative line under title
    const lineWidth = 60;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - lineWidth / 2, yPos + 3, pageWidth / 2 + lineWidth / 2, yPos + 3);
    
    yPos += 15;

    // ===== EXAM & STUDENT INFO TABLE =====
    const tableStartY = yPos;
    const tableHeight = 50;
    
    // Only border - no fill
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(25, tableStartY, pageWidth - 50, tableHeight);

    // Table content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    const leftCol = 30;
    const rightCol = pageWidth / 2 + 5;
    let rowY = tableStartY + 10;
    const rowGap = 12;

    // Row 1: Exam Name & Grade
    doc.text('Exam:', leftCol, rowY);
    doc.setFont('helvetica', 'normal');
    doc.text(registration.exam_name || 'N/A', leftCol + 25, rowY);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Grade:', rightCol, rowY);
    doc.setFont('helvetica', 'normal');
    doc.text(registration.grade_name || 'N/A', rightCol + 20, rowY);

    // Row 2: Student Name
    rowY += rowGap;
    doc.setFont('helvetica', 'bold');
    doc.text('Student:', leftCol, rowY);
    doc.setFont('helvetica', 'normal');
    doc.text(registration.student_name || 'N/A', leftCol + 25, rowY);

    // Row 3: Email & Admission Number
    rowY += rowGap;
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', leftCol, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(registration.student_email || 'N/A', leftCol + 25, rowY);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Admission #:', rightCol, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(registration.admission_number || 'N/A', rightCol + 30, rowY);

    yPos = tableStartY + tableHeight + 15;

    // ===== EXAM SCHEDULE SECTION =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Examination Schedule', pageWidth / 2, yPos, { align: 'center' });
    
    // Decorative line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 35, yPos + 2, pageWidth / 2 + 35, yPos + 2);

    yPos += 10;

    // Schedule table header
    const scheduleTableX = 25;
    const scheduleTableWidth = pageWidth - 50;
    const colWidths = [55, 50, 35, 35];
    
    // Header - border only
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(scheduleTableX, yPos, scheduleTableWidth, 12);
    
    // Header text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Subject', scheduleTableX + 3, yPos + 8);
    doc.text('Date', scheduleTableX + colWidths[0] + 3, yPos + 8);
    doc.text('Start Time', scheduleTableX + colWidths[0] + colWidths[1] + 3, yPos + 8);
    doc.text('End Time', scheduleTableX + colWidths[0] + colWidths[1] + colWidths[2] + 3, yPos + 8);

    yPos += 12;

    // Debug: Log the registration data
    console.log('Registration data:', registration);
    console.log('Subject schedule:', registration.subject_schedule);
    console.log('Chosen subjects:', registration.chosen_subjects);

    // Schedule table rows
    if (registration.subject_schedule && registration.subject_schedule.length > 0) {
      registration.subject_schedule.forEach((subject) => {
        // Border only - no fill
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(scheduleTableX, yPos, scheduleTableWidth, 10);

        // Row content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(subject.subject_name || 'N/A', scheduleTableX + 3, yPos + 7);
        doc.text(formatDate(subject.exam_date), scheduleTableX + colWidths[0] + 3, yPos + 7);
        doc.text(formatTime(subject.start_time), scheduleTableX + colWidths[0] + colWidths[1] + 3, yPos + 7);
        doc.text(formatTime(subject.end_time), scheduleTableX + colWidths[0] + colWidths[1] + colWidths[2] + 3, yPos + 7);

        yPos += 10;
      });
    } else {
      // No schedule available
      doc.rect(scheduleTableX, yPos, scheduleTableWidth, 10);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('No exam schedule available', scheduleTableX + 3, yPos + 7);
      yPos += 10;
    }

    yPos += 10;

    // ===== INSTRUCTIONS SECTION =====
// Border only - no fill
doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.5);
doc.rect(25, yPos, pageWidth - 50, 45);

doc.setTextColor(0, 0, 0);
doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.text('Important Instructions', 30, yPos + 8);

doc.setTextColor(0, 0, 0);
doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
const instructions = [
  '1. Bring this printed admission card to the examination hall.',
  '2. Arrive at least 30 minutes before the exam starts.',
  '3. No electronic devices (phones, calculators, smartwatches) are allowed.',
  '4. Bring your own stationery (pens, pencils, eraser, ruler).',
  '5. Follow all examination rules and guidelines strictly.'
];

let instructY = yPos + 15;
instructions.forEach(inst => {
  doc.text(inst, 30, instructY);
  instructY += 6;
});

// space after box
yPos += 50;
yPos += 10;

// ===== SIGNATURE SECTION =====
doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.5);
doc.line(30, yPos, 90, yPos);
doc.line(pageWidth - 90, yPos, pageWidth - 30, yPos);

doc.setTextColor(0, 0, 0);
doc.setFontSize(8);
doc.setFont('helvetica', 'italic');
doc.text('Student Signature', 60, yPos + 5, { align: 'center' });
doc.text('Examiner Signature', pageWidth - 60, yPos + 5, { align: 'center' });

// ❌ Removed the unwanted line

    // ===== FOOTER =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const footerText = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} | For Official Use Only`;
    doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Save the PDF
    doc.save(`Admission_Card_${registration.admission_number}.pdf`);

    // Close modal
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Download Admission Card</h3>
          <p className="text-sm text-gray-600">Your exam pass to enter the examination hall</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6 border border-blue-200">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Exam:</span>
              <span className="font-semibold text-gray-800">{registration.exam_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Admission Number:</span>
              <span className="font-bold text-blue-600">{registration.admission_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Subjects:</span>
              <span className="font-semibold text-gray-800">
                {registration.subject_schedule?.length || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <p className="text-xs text-yellow-800">
              විභාග ශාලාවට පිවිසීමට මෙම ප්‍රවේශ පත්‍රය මුද්‍රිතව ගෙන එන්න.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 border-2 border-gray-300"
            >
              Cancel
            </button>
          )}
          <button
            onClick={generatePDF}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdmissionCardGenerator;