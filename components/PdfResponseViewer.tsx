'use client';

import React from 'react';

type PdfResponseViewerProps = {
  base64: string;
  filename?: string; // optional, not rendered; embedded viewer has its own download
};

export default function PdfResponseViewer({ base64 }: PdfResponseViewerProps) {
  // pagemode=none hides the thumbnail sidebar in Chrome's PDF viewer to avoid a wide pane + extra scrollbar
  const dataUrl = `data:application/pdf;base64,${base64}#pagemode=none`;

  return (
    <div className="pdf-response-viewer">
      <div className="pdf-response-viewer-frame">
        <iframe
          src={dataUrl}
          title="PDF Report"
          className="pdf-response-viewer-iframe"
        />
      </div>
    </div>
  );
}
