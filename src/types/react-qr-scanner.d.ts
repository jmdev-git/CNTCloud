declare module 'react-qr-scanner' {
  import * as React from 'react';

  export interface QrScannerProps {
    onScan: (data: any) => void;
    onError: (err: any) => void;
    delay?: number | false;
    facingMode?: 'user' | 'rear' | 'environment';
    legacyMode?: boolean;
    style?: React.CSSProperties;
    className?: string;
    resolution?: number;
    aspectRatio?: string;
  }

  const QrScanner: React.ComponentType<QrScannerProps>;
  export default QrScanner;
}
