import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0F294A', // Institutional school navy blue
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
}

export function downloadQrCodeImage(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
