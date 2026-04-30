'use client';

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

const LucideIcon = ({ name, className = "w-4 h-4", size }: LucideIconProps) => {
  const getIconPath = () => {
    switch (name) {
      case 'calendar':
        return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
      case 'bar-chart':
        return 'M3 3v18h18M18 17V9M13 17V5M8 17v-3';
      case 'alert-circle':
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'file-text':
        return 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8';
      case 'cake':
        return 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.553 2.553 0 013 15.546M21 12V9a2 2 0 00-2-2h-2.5M3 12V9a2 2 0 012-2h2.5m5 0V5a2 2 0 012-2h2a2 2 0 012 2v2M9 21v-5a2 2 0 012-2h2a2 2 0 012 2v5';
      case 'newspaper':
        return 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0a2 2 0 012 2v11a2 2 0 01-2 2h-6m0 0l-4 4m4-4l4 4';
      case 'filter':
        return 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z';
      case 'globe':
        return 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 15.93a8 8 0 0 1-6-6.93 8 8 0 0 1 6-6.93zm2 0V5.07a8 8 0 0 1 6 6.93 8 8 0 0 1-6 6.93z';
      case 'building-2':
        return 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18H6zM10 6h4M10 10h4M10 14h4M10 18h4';
      case 'ticket':
        return 'M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z';
      case 'party':
        return 'M17.5 12c1.38 0 2.5-1.12 2.5-2.5S18.88 7 17.5 7 15 8.12 15 9.5s1.12 2.5 2.5 2.5zM9 12c1.38 0 2.5-1.12 2.5-2.5S10.38 7 9 7 6.5 8.12 6.5 9.5 7.62 12 9 12zm8.5 0c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5z';
      case 'clock':
        return 'M12 8v4l3 3M12 2a10 10 0 110 20 10 10 0 010-20z';
      case 'map-pin':
        return 'M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10zm0-8a2 2 0 100-4 2 2 0 000 4z';
      case 'pencil':
      case 'edit-2':
        return 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z';
      case 'trash-2':
        return 'M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2 M10 11v6 M14 11v6';
      case 'search':
        return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';
      case 'plus-circle':
        return 'M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'list':
        return 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01';
      case 'loader-2':
        return 'M21 12a9 9 0 11-6.219-8.56';
      case 'bar-chart-3':
      case 'bar-chart-big':
        return 'M3 3v18h18M18 17V9M13 17V5M8 17v-3';
      case 'clipboard-check':
        return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4';
      case 'user-check':
        return 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8z M17 11l2 2 4-4';
      case 'globe':
        return 'M12 2a10 10 0 100 20 10 10 0 000-20z M2 12h20 M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z';
      case 'filter':
        return 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z';
      case 'check-circle':
      case 'check-circle-2':
        return 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3';
      case 'help-circle':
        return 'M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3 M12 17h.01 M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'mail':
        return 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6';
      case 'file-spreadsheet':
        return 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M8 13h2 M14 13h2 M8 17h2 M14 17h2 M10 8V2';
      case 'x':
        return 'M18 6L6 18M6 6l12 12';
      case 'utensils':
        return 'M18 8V3 M18 21v-3.5c0-1.38-1.12-2.5-2.5-2.5h-1.5c-1.38 0-2.5 1.12-2.5 2.5V21 M6 3v12c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V3 M10 3v4 M8 3v4';
      case 'utensils-cross-over':
        return 'M16 2l-2.3 2.3M11 7l-2.3 2.3M18.9 4.1L12 11M5 22l6.5-6.5M19 19L11 11M5 5l6.5 6.5M5 2l2.3 2.3M10 7l2.3 2.3';
      case 'pie-chart':
        return 'M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z';
      case 'grid':
        return 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zm-11 0h7v7H3v-7z';
      case 'log-out':
        return 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9';
      case 'award':
        return 'M12 15l-3.5 2 1-4.1L6.4 10l4.2-.6L12 5.5l1.4 3.9 4.2.6-3.1 2.9 1 4.1L12 15z M12 15v6 M12 15v6M9 18l-1.5 4M15 18l1.5 4';
      case 'maximize-2':
        return 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7';
      case 'lock':
        return 'M7 11V7a5 5 0 0110 0v4 M8 11h8a2 2 0 012 2v5a2 2 0 01-2 2H8a2 2 0 01-2-2v-5a2 2 0 012-2z';
      case 'external-link':
        return 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3';
      case 'user':
        return 'M12 12a4 4 0 100-8 4 4 0 000 8z M4 20a8 8 0 0116 0';
      case 'user-plus':
        return 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M12 11a4 4 0 10-8 0 4 4 0 008 0z M19 8v6 M16 11h6';
      case 'users':
        return 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M22 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75';
      case 'shield-check':
        return 'M12 22c-6.5-3.8-8-6-8-10V7l8-4 8 4v5c0 4-1.5 6.2-8 10 M9 12l2 2 4-4';
      case 'mail-check':
        return 'M22 6v12H2V6l10 7 10-7z M16 12l2 2 3-3';
      case 'arrow-right':
        return 'M5 12h14 M12 5l7 7-7 7';
      case 'chevron-right':
        return 'M9 18l6-6-6-6';
      case 'chevron-left':
        return 'M15 18l-6-6 6-6';
      case 'image-plus':
        return 'M4 4h16v16H4z M12 8v8 M8 12h8';
      case 'plus':
        return 'M12 5v14M5 12h14';
      case 'trending-up':
        return 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6';
      case 'calendar-days':
        return 'M8 2v4M16 2v4M3 10h18M3 4h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2zM7 14h.01M12 14h.01M17 14h.01M7 18h.01M12 18h.01M17 18h.01';
      case 'loader':
        return 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83';
      case 'history':
        return 'M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8 M3 3v5h5';
      case 'building':
        return 'M3 21h18M9 8h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16';
      case 'sliders':
        return 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6';
      case 'settings-2':
      case 'sliders-horizontal':
        return 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6';
      case 'zap':
        return 'M13 2 L3 14h9l-1 8 10-12h-9l1-8z';
      case 'key':
        return 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 15.5m0 0l1.414-1.414L18.328 15.5l1.415-1.414 1.414 1.414-1.414 1.414L19.742 16.9l-1.414 1.414-1.414-1.414-1.414 1.414-1.414-1.414z';
      case 'qr-code':
        return 'M3 3h18v18H3V3zm16 0v18h2V3h-2zm-10 10h6v2H9v-2zm-4 0h6v2H5v-2zm8 4h6v2h-6v-2z';
      default:
        return '';
    }
  };

  const iconPath = getIconPath();
  
  if (!iconPath) return null;

  return (
    <svg 
      className={className} 
      width={size || 24} 
      height={size || 24}
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2}
      strokeLinecap="round" 
      strokeLinejoin="round" 
      viewBox="0 0 24 24"
    >
      <path d={iconPath} />
    </svg>
  );
};

export default LucideIcon;
