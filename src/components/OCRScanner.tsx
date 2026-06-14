import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import type { OCRResult } from '../types';
import './OCRScanner.css';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface OCRScannerProps {
  onWordsDetected: (words: string[], imageUrls: string[], sentences: string[]) => void;
  onCancel: () => void;
}

interface ImageWithText {
  url: string;
  text?: string;
}

export const OCRScanner: React.FC<OCRScannerProps> = ({ onWordsDetected, onCancel }) => {
  const [images, setImages] = useState<ImageWithText[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Støtt flere filer samtidig
      for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
          // Handle PDF files - convert each page to image
          try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDocument = await loadingTask.promise;

            // Convert each page to image
            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
              const page = await pdfDocument.getPage(pageNum);
              const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better quality

              // Create canvas
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              // Render page to canvas
              await page.render({
                canvasContext: context!,
                viewport: viewport,
              }).promise;

              // Convert canvas to data URL
              const imageUrl = canvas.toDataURL('image/png');
              setImages((prev) => [...prev, { url: imageUrl }]);
            }
          } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Kunne ikke lese PDF-filen. Prøv med et bilde i stedet.');
          }
        } else {
          // Handle image files (JPG, PNG)
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            setImages((prev) => [...prev, { url: imageUrl }]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const processAllImages = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    const allWords: string[] = [];
    const allSentences: string[] = [];
    const processedImages: ImageWithText[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        setCurrentImageIndex(i);
        const image = images[i];

        const result = await Tesseract.recognize(image.url, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const overallProgress = ((i / images.length) + (m.progress / images.length)) * 100;
              setProgress(Math.round(overallProgress));
            }
          },
        });

        const text = result.data.text;
        processedImages.push({ url: image.url, text });

        // Extract sentences - split on sentence boundaries
        const sentences = text
          .split(/[.!?]+/) // Split on sentence ending punctuation
          .map(s => s.trim())
          .filter(s => {
            // Keep sentences that:
            // - Have at least 3 words
            // - Start with a capital letter or common word
            // - Contain mostly letters (not OCR noise)
            const wordCount = s.split(/\s+/).length;
            const hasEnoughWords = wordCount >= 3;
            const startsProper = /^[A-Z]/.test(s) || /^(i|a|an|the|my|your|he|she|it|we|they)\s/i.test(s);
            const hasLetters = (s.match(/[a-zA-Z]/g) || []).length > s.length * 0.5;

            return hasEnoughWords && startsProper && hasLetters && s.length > 10;
          })
          .map(s => {
            // Clean up the sentence
            s = s.trim();
            // Ensure it ends with a period if it doesn't have punctuation
            if (!/[.!?]$/.test(s)) {
              s = s + '.';
            }
            // Capitalize first letter
            s = s.charAt(0).toUpperCase() + s.slice(1);
            return s;
          });

        allSentences.push(...sentences);

        // Extract words - filter out OCR noise
        const commonShortWords = ['i', 'a', 'an', 'at', 'in', 'on', 'to', 'is', 'it', 'of', 'or', 'be', 'as', 'we', 'me', 'he', 'so', 'no', 'my', 'by', 'up', 'do'];

        const words = text
          .split(/[\s\n\r,;.!?]+/) // Split on whitespace and common punctuation
          .map((word) => word.replace(/[^a-zA-ZæøåÆØÅ'-]/g, '')) // Keep apostrophes and hyphens
          .filter((word) => {
            const hasLetter = /[a-zA-ZæøåÆØÅ]/.test(word);
            const isNotNumber = !/^\d+$/.test(word);
            const lowerWord = word.toLowerCase();

            // Reject if too short (unless common word)
            if (word.length < 2) {
              return commonShortWords.includes(lowerWord);
            }

            // Reject if 2-3 chars and ALL CAPS (likely OCR noise like "RO", "SAL")
            if (word.length <= 3 && word === word.toUpperCase() && !commonShortWords.includes(lowerWord)) {
              return false;
            }

            // Reject weird mixed case patterns (like "oSts")
            const weirdCase = /[a-z][A-Z][a-z]|[a-z]{2}[A-Z]/.test(word);
            if (weirdCase) return false;

            // Reject if contains 3+ consecutive identical characters (like "aaa")
            if (/(.)\1{2,}/.test(word)) return false;

            return hasLetter && isNotNumber && word.length > 0;
          })
          .map(word => word.trim());

        allWords.push(...words);
      }

      // Remove duplicates
      const uniqueWords = Array.from(new Set(allWords));
      const uniqueSentences = Array.from(new Set(allSentences));

      setImages(processedImages);
      setIsProcessing(false);

      // Pass words, image URLs, and sentences
      onWordsDetected(uniqueWords, images.map(img => img.url), uniqueSentences);
    } catch (error) {
      console.error('OCR Error:', error);
      setIsProcessing(false);
      alert('Kunne ikke lese bildene. Prøv igjen med klarere bilder.');
    }
  };

  return (
    <div className="ocr-scanner">
      <div className="scanner-header">
        <h2>📸 Skann glosesider</h2>
        <button className="close-button" onClick={onCancel}>
          ✕
        </button>
      </div>

      <div className="scanner-content">
        <div className="upload-area-multi">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            capture="environment"
            multiple
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />

          {images.length === 0 ? (
            <div className="upload-placeholder" onClick={handleCapture}>
              <div className="camera-icon">📷</div>
              <p className="upload-text">Ta bilder av glosesidene</p>
              <p className="upload-hint">Støtter JPG, PNG og PDF • Du kan legge til flere filer</p>
            </div>
          ) : (
            <div className="images-section">
              <div className="images-grid">
                {images.map((image, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={image.url} alt={`Side ${index + 1}`} className="preview-thumbnail" />
                    <button className="remove-image-button" onClick={() => removeImage(index)}>
                      ✕
                    </button>
                    <div className="image-label">Side {index + 1}</div>
                    {image.text && (
                      <div className="image-text-preview">
                        <small>{image.text.substring(0, 50)}...</small>
                      </div>
                    )}
                  </div>
                ))}

                <div className="add-more-card" onClick={handleCapture}>
                  <div className="add-more-icon">➕</div>
                  <p>Legg til flere</p>
                </div>
              </div>

              {isProcessing && (
                <div className="processing-overlay-multi">
                  <div className="spinner"></div>
                  <p className="processing-text">
                    Leser bilde {currentImageIndex + 1} av {images.length}...
                  </p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="progress-text">{progress}%</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {images.length > 0 && !isProcessing && (
        <div className="scanner-actions">
          <button className="secondary-button" onClick={() => setImages([])}>
            Fjern alle ({images.length})
          </button>
          <button className="primary-button" onClick={processAllImages}>
            Les tekst fra {images.length} {images.length === 1 ? 'bilde' : 'bilder'}
          </button>
        </div>
      )}

      <div className="scanner-tips">
        <h3>💡 Tips for best resultat:</h3>
        <ul>
          <li>Last opp bilder (JPG, PNG) eller PDF-filer</li>
          <li>PDF-filer konverteres automatisk til bilder (én side per bilde)</li>
          <li>Sørg for god belysning på alle bildene</li>
          <li>Hold kameraet rett over siden</li>
          <li>Unngå skygger og refleksjoner</li>
          <li>Du kan legge til flere filer etter hverandre</li>
        </ul>
      </div>
    </div>
  );
};
