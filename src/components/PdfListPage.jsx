import React from 'react';
import { data } from './data';
import './PdfListPage.css';

const PdfListPage = ({ user, onLogout, cycle, type, subjectId, onNavigate, onBack }) => {

  const currentCycleData = data[cycle];
  const typeLabels = {
    textbook: 'Textbooks',
    notes: 'Notes',
    pyqs: 'Previous Year Questions'
  };

  let pdfs = [];
  let pageTitle = '';

  if (subjectId === 'all' && type === 'pyqs') {
    // Case 1: We are showing all PYQs for an entire cycle
    pageTitle = `${currentCycleData.title} - ${typeLabels.pyqs}`;

    // Collect all PYQs
    pdfs = currentCycleData.subjects.flatMap(subject =>
      subject.pyqs.map(pyq => ({
        ...pyq,
        title: `${subject.name} - ${pyq.title}`,
        url: pyq.url
      }))
    );
  } else {
    // Case 2: We are showing materials for a single subject
    const currentSubject = currentCycleData?.subjects.find(s => s.id === subjectId);
    if (currentSubject) {
      pageTitle = `${typeLabels[type]} for ${currentSubject.name}`;

      pdfs = (currentSubject[type] || []).map(pdf => ({
        ...pdf,
        url: pdf.url
      }));
    }
  }

  return (
    <div className="pdf-list-page">
      <main className="pdf-list-main">
        <div className="container">
          <div className="page-header">
            <h2>{pageTitle}</h2>
            <p>Select a document to view.</p>
          </div>

          <div className="pdf-list">
            {pdfs.length > 0 ? (
              pdfs.map(pdf => (
                <a
                  key={pdf.url}
                  href={pdf.url}
                  // --- FIX: Change target to "_blank" ---
                  // This tells the browser to open the link in a new tab
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdf-list-item"
                >
                  <span className="pdf-icon">📄</span>
                  <span className="pdf-title">{pdf.title}</span>
                  <span className="arrow">→</span>
                </a>
              ))
            ) : (
              <p className="no-pdfs">No documents available for this category yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PdfListPage;