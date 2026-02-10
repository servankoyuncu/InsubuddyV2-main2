import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';

const PDFViewer = ({ pdfData }) => {
  const [pdf, setPdf] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);

  // PDF laden
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        // Unterstütze sowohl Base64 Data-URLs als auch HTTP-URLs (Supabase Storage)
        let loadingTask;
        if (pdfData.startsWith('data:')) {
          loadingTask = pdfjsLib.getDocument({ data: atob(pdfData.split(',')[1]) });
        } else {
          loadingTask = pdfjsLib.getDocument(pdfData);
        }
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('PDF laden fehlgeschlagen:', err);
        setError('PDF konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    if (pdfData) {
      loadPDF();
    }
  }, [pdfData]);

  // Seite rendern
  const renderPage = useCallback(async (pageNum) => {
    if (!pdf || !canvasRef.current) return;

    try {
      // Vorherigen Render-Task abbrechen
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Skalierung berechnen basierend auf Container-Breite
      const containerWidth = containerRef.current?.clientWidth || 360;
      const viewport = page.getViewport({ scale: 1 });
      const fitScale = (containerWidth - 32) / viewport.width;
      const finalScale = fitScale * scale;
      const scaledViewport = page.getViewport({ scale: finalScale });

      // HiDPI/Retina Support für scharfe PDFs
      const dpr = window.devicePixelRatio || 1;
      canvas.height = scaledViewport.height * dpr;
      canvas.width = scaledViewport.width * dpr;
      canvas.style.width = `${scaledViewport.width}px`;
      canvas.style.height = `${scaledViewport.height}px`;
      context.scale(dpr, dpr);

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Seite rendern fehlgeschlagen:', err);
      }
    }
  }, [pdf, scale]);

  useEffect(() => {
    renderPage(currentPage);
  }, [currentPage, renderPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const zoom = (direction) => {
    setScale(prev => {
      const newScale = direction === 'in' ? prev + 0.25 : prev - 0.25;
      return Math.max(0.5, Math.min(3, newScale));
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">PDF wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-200 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => zoom('out')}
            disabled={scale <= 0.5}
            className="p-1.5 rounded-lg hover:bg-gray-300 disabled:opacity-30"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 w-10 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => zoom('in')}
            disabled={scale >= 3}
            className="p-1.5 rounded-lg hover:bg-gray-300 disabled:opacity-30"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
        <canvas ref={canvasRef} className="shadow-lg" />
      </div>
    </div>
  );
};

export default PDFViewer;
