export type AcademicStyle = 'ieee' | 'nature' | 'neurips' | 'monochrome';

export interface StyleConfig {
  id: AcademicStyle;
  name: string;
  journal: string;
  fontFamily: string;
  bgFill: string;
  axisStroke: string;
  gridStroke: string;
  trainLine: { stroke: string; strokeWidth: number; dasharray?: string };
  valLine: { stroke: string; strokeWidth: number; dasharray?: string };
  accentColor: string;
  paretoColor: string;
  textFill: string;
  subtextFill: string;
  matrixColormap: 'standard' | 'viridis' | 'okabe_ito' | 'monochrome';
}

export const ACADEMIC_STYLES: Record<AcademicStyle, StyleConfig> = {
  ieee: {
    id: 'ieee',
    name: 'IEEE Transactions',
    journal: 'IEEE TGRS / TPAMI Style',
    fontFamily: '"STIX Two Text", "Times New Roman", Times, serif',
    bgFill: '#ffffff',
    axisStroke: '#111827',
    gridStroke: '#e5e7eb',
    trainLine: { stroke: '#0f4c81', strokeWidth: 2.5 }, // Classic IEEE Navy
    valLine: { stroke: '#c0392b', strokeWidth: 2.2, dasharray: '6 3' }, // Crimson Dashed
    accentColor: '#0f4c81',
    paretoColor: '#0f4c81',
    textFill: '#111827',
    subtextFill: '#4b5563',
    matrixColormap: 'standard',
  },
  nature: {
    id: 'nature',
    name: 'Nature / Springer',
    journal: 'Nature Portfolio & Scientific Reports',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    bgFill: '#ffffff',
    axisStroke: '#374151',
    gridStroke: '#f3f4f6',
    trainLine: { stroke: '#0072B2', strokeWidth: 2.6 }, // Okabe-Ito Blue
    valLine: { stroke: '#D55E00', strokeWidth: 2.4, dasharray: '5 3' }, // Okabe-Ito Vermilion
    accentColor: '#009E73', // Okabe-Ito Bluish Green
    paretoColor: '#009E73',
    textFill: '#1f2937',
    subtextFill: '#6b7280',
    matrixColormap: 'okabe_ito',
  },
  neurips: {
    id: 'neurips',
    name: 'NeurIPS / ACM SIGGRAPH',
    journal: 'Top Machine Learning & AI Conferences',
    fontFamily: '"Plus Jakarta Sans", "JetBrains Mono", sans-serif',
    bgFill: '#ffffff',
    axisStroke: '#18181b',
    gridStroke: '#e4e4e7',
    trainLine: { stroke: '#4f46e5', strokeWidth: 2.8 }, // Indigo
    valLine: { stroke: '#f59e0b', strokeWidth: 2.5, dasharray: '4 2' }, // Amber
    accentColor: '#10b981',
    paretoColor: '#10b981',
    textFill: '#09090b',
    subtextFill: '#71717a',
    matrixColormap: 'viridis',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome (Print-Ready B&W)',
    journal: 'Physical Laser Print & B&W Submissions',
    fontFamily: '"STIX Two Text", "Times New Roman", Times, serif',
    bgFill: '#ffffff',
    axisStroke: '#000000',
    gridStroke: '#d1d5db',
    trainLine: { stroke: '#000000', strokeWidth: 3.0 }, // Solid Black
    valLine: { stroke: '#4b5563', strokeWidth: 2.4, dasharray: '7 4' }, // Charcoal Dashed
    accentColor: '#000000',
    paretoColor: '#000000',
    textFill: '#000000',
    subtextFill: '#374151',
    matrixColormap: 'monochrome',
  },
};

/**
 * Exports an SVG element as a standalone scalable vector graphics file (.svg)
 */
export function exportSvgAsFile(svgEl: SVGSVGElement, filename: string): void {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgEl);

  // Add namespaces if not present
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+xmlns\:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // Prepend XML declaration
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `${filename}.svg`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

/**
 * Converts an SVG element to high-resolution publication-quality PNG (300 DPI equivalent)
 */
export async function exportSvgAsPng(
  svgEl: SVGSVGElement,
  filename: string,
  scale = 3.0 // 3x scale produces crisp 300 DPI publication quality
): Promise<void> {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgEl);

  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const bbox = svgEl.getBoundingClientRect();
      const width = (bbox.width || 800) * scale;
      const height = (bbox.height || 400) * scale;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Canvas context unavailable'));
      }

      // White background for papers
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            URL.revokeObjectURL(url);
            return reject(new Error('Failed to create PNG blob'));
          }
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `${filename}_300dpi.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(url);
          resolve();
        },
        'image/png',
        1.0
      );
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
}
