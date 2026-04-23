"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import LucideIcon from "./LucideIcon";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface QRScannerProps {
  onScan: (data: string) => void;
  result?: { success: boolean; message: string } | null;
  events: any[];
  selectedEventId: string;
  onEventChange: (id: string) => void;
  attendance: any[];
  isLoading: boolean;
}

export default function QRScanner({
  onScan,
  result,
  events,
  selectedEventId,
  onEventChange,
  attendance = [],
  isLoading
}: QRScannerProps) {
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<number>(0);
  const readerId = "qr-reader";

  useEffect(() => {
    let isMounted = true;

    if (isScannerReady) {
      const startScanner = async () => {
        try {
          if (isMounted) {
            setIsInitializing(true);
            setCameraError(null);
          }
          
          if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(readerId);
          }

          const config = {
            fps: 20,
            qrbox: (viewWidth: number, viewHeight: number) => {
              const size = Math.min(viewWidth, viewHeight) * 0.7;
              return { width: size, height: size };
            },
          };

          // Try to start with environment (back) camera
          await scannerRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              // Throttle scans to once every 2 seconds
              const now = Date.now();
              if (now - lastScanRef.current < 2000) return;
              lastScanRef.current = now;
              
              if (isMounted) {
                try {
                  onScan(decodedText);
                } catch (scanErr) {
                  console.error("Callback error:", scanErr);
                }
              }
            },
            (errorMessage) => {
              // Ignore constant scanning errors
            }
          );
          
          if (isMounted) {
            setIsInitializing(false);
          }
        } catch (err: any) {
          console.error("Scanner error:", err);
          if (isMounted) {
            let msg = "Could not access camera.";
            if (err?.name === "NotAllowedError") msg = "Camera permission denied. Please allow access.";
            if (err?.name === "NotReadableError") msg = "Camera is already in use by another app.";
            setCameraError(msg);
            setIsInitializing(false);
            setIsScannerReady(false);
          }
        }
      };

      startScanner();
    }

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => {
          // If stopping fails because it's already stopped or not started, ignore
          console.warn("Stop scanner warning:", err);
        });
      }
    };
  }, [isScannerReady, onScan]);

  const presentCount = attendance.filter(a => a.attended).length;
  const registeredCount = attendance.length;
  const selectedEvent = events.find(e => (e.id || e._id) === selectedEventId);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="bg-[#000] rounded-2xl border border-white/10 shadow-2xl p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
              <LucideIcon name="qr-code" className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Event Access Control</h3>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">Real-time attendance & verification system</p>
            </div>
          </div>
          
          <div className="w-full md:w-[320px]">
            <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2.5 ml-1">
              Select Active Event
            </label>
            <Select
              value={selectedEventId}
              onValueChange={(value) => onEventChange(value)}
            >
              <SelectTrigger className="w-full h-12 bg-white/5 border-white/10 rounded-xl px-4 text-white text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-lg">
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 text-white p-2 min-w-[280px]">
                {/* Invited Events Group */}
                {(() => {
                  const invitedEvents = events.filter(e => e.category === 'events' && e.registrationType === 'INVITE_ONLY');
                  if (invitedEvents.length === 0) return null;
                  return (
                    <div className="mb-4">
                      <div className="px-3 py-2 flex items-center gap-2 opacity-40">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ed1c24]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Invited Events</span>
                      </div>
                      {invitedEvents.map(event => (
                        <SelectItem 
                          key={event.id || event._id} 
                          value={event.id || event._id}
                          className="rounded-lg py-3 focus:bg-[#ed1c24] focus:text-white m-1 text-[10px] font-bold uppercase tracking-widest pl-8"
                        >
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-3">
                              <LucideIcon name="ticket" className="w-3 h-3 opacity-50" />
                              <span>{event.title}</span>
                            </div>
                            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">
                              {event.businessUnit || 'General Access'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  );
                })()}

                {/* Department Events Group */}
                {(() => {
                  const deptEvents = events.filter(e => e.category === 'events' && (e.registrationType === 'GENERAL' || e.registrationType === 'BU_ONLY' || !e.registrationType));
                  if (deptEvents.length === 0) return null;
                  return (
                    <div className="mb-4">
                      <div className="px-3 py-2 flex items-center gap-2 opacity-40">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Department Events</span>
                      </div>
                      {deptEvents.map(event => (
                        <SelectItem 
                          key={event.id || event._id} 
                          value={event.id || event._id}
                          className="rounded-lg py-3 focus:bg-[#ed1c24] focus:text-white m-1 text-[10px] font-bold uppercase tracking-widest pl-8"
                        >
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-3">
                              <LucideIcon name="building-2" className="w-3 h-3 opacity-50" />
                              <span>{event.title}</span>
                            </div>
                            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">
                              {event.businessUnit || 'General Access'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  );
                })()}

                {/* Birthday Events Group */}
                {(() => {
                  const birthdayEvents = events.filter(e => e.category === 'events' && e.registrationType === 'RULE_BASED');
                  if (birthdayEvents.length === 0) return null;
                  return (
                    <div className="mb-2">
                      <div className="px-3 py-2 flex items-center gap-2 opacity-40">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Birthday Events</span>
                      </div>
                      {birthdayEvents.map(event => (
                        <SelectItem 
                          key={event.id || event._id} 
                          value={event.id || event._id}
                          className="rounded-lg py-3 focus:bg-[#ed1c24] focus:text-white m-1 text-[10px] font-bold uppercase tracking-widest pl-8"
                        >
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-3">
                              <LucideIcon name="cake" className="w-3 h-3 opacity-50" />
                              <span>{event.title}</span>
                            </div>
                            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] ml-6">
                              {event.businessUnit || 'General Access'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  );
                })()}

                {events.filter(e => e.category === 'events').length === 0 && (
                  <div className="py-8 text-center opacity-30">
                    <LucideIcon name="calendar-x" className="w-8 h-8 mx-auto mb-3" />
                    <p className="text-[9px] font-black uppercase tracking-widest">No Events Available</p>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Scanner Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#000] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live Scanner View</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Back Camera Only</span>
                <LucideIcon name="camera" className="w-3.5 h-3.5 text-white/20" />
              </div>
            </div>

            <div className="p-8">
              {cameraError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <LucideIcon name="alert-circle" className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-widest">{cameraError}</p>
                </div>
              )}

              {!isScannerReady ? (
                <button
                  onClick={() => setIsScannerReady(true)}
                  disabled={!selectedEventId || isInitializing}
                  className="w-full aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-6 hover:bg-white/5 hover:border-red-500/40 transition-all group disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-all duration-500 shadow-2xl border border-red-500/20">
                    <LucideIcon name={isInitializing ? "loader" : "camera"} className={cn("w-10 h-10", isInitializing && "animate-spin")} />
                  </div>
                  <div className="text-center relative z-10">
                    <p className="text-white font-black uppercase tracking-[0.2em] text-sm">
                      {isInitializing ? "Initializing..." : "Initialize Scanner"}
                    </p>
                    <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mt-2">
                      {isInitializing ? "Please wait for camera access" : "Tap to start camera"}
                    </p>
                  </div>
                </button>
              ) : (
                <div className="space-y-6 animate-in zoom-in-95 duration-500 relative">
                  <div className="relative overflow-hidden rounded-2xl border-4 border-white/10 bg-[#000] shadow-2xl aspect-square flex items-center justify-center">
                    <div id={readerId} className="w-full h-full" />
                    
                    {/* Scanning Line Animation Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scan-line" />
                      
                      {/* Corner Accents - Corporate Look */}
                      <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white/40 rounded-tl-lg" />
                      <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white/40 rounded-tr-lg" />
                      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white/40 rounded-bl-lg" />
                      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white/40 rounded-br-lg" />
                    </div>
                  </div>

                  <button
                    onClick={() => setIsScannerReady(false)}
                    className="w-full h-14 bg-white/5 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-white/10 hover:border-red-500 shadow-lg flex items-center justify-center gap-3 group"
                  >
                    <LucideIcon name="square" className="w-4 h-4 fill-current group-hover:scale-90 transition-transform" />
                    Stop Scanning Session
                  </button>

                  <style jsx global>{`
                    @keyframes scan-line {
                      0% { top: 10%; }
                      50% { top: 90%; }
                      100% { top: 10%; }
                    }
                    .animate-scan-line {
                      animation: scan-line 3s ease-in-out infinite;
                    }
                    #${readerId} video {
                      object-fit: cover !important;
                      width: 100% !important;
                      height: 100% !important;
                      border-radius: 12px;
                    }
                  `}</style>
                </div>
              )}
            </div>
            
            {result && (
              <div className={cn(
                "px-8 py-5 flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-500 border-t border-white/5",
                result.success ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg",
                  result.success ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                )}>
                  <LucideIcon name={result.success ? "check" : "x"} className="w-4 h-4 stroke-[3px]" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.1em]">{result.message}</p>
              </div>
            )}
          </div>

          {selectedEvent && (
            <div className="bg-[#000] border border-white/10 rounded-2xl p-6 flex items-center gap-6 shadow-xl">
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ed1c24] shrink-0">
                <LucideIcon name={
                  selectedEvent.registrationType === 'INVITE_ONLY' ? 'ticket' :
                  selectedEvent.registrationType === 'BU_ONLY' ? 'building-2' :
                  selectedEvent.registrationType === 'RULE_BASED' ? 'filter' : 'globe'
                } className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Security Protocol</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                    selectedEvent.registrationType === 'INVITE_ONLY' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    "bg-[#ed1c24]/10 text-[#ed1c24] border-[#ed1c24]/20"
                  )}>
                    {selectedEvent.registrationType?.replace('_', ' ') || 'GENERAL'}
                  </span>
                </div>
                <h4 className="text-white font-bold text-lg tracking-tight truncate">{selectedEvent.title}</h4>
              </div>
            </div>
          )}
        </div>

        {/* Stats & List Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#000] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] -mb-16 -mr-16 rounded-full" />
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Attendance Analytics
            </h4>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-4xl font-black text-white tracking-tighter">{registeredCount}</p>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Expected</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black text-emerald-500 tracking-tighter">{presentCount}</p>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Verified</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Completion Rate</span>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  {registeredCount > 0 ? Math.round((presentCount / registeredCount) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                  style={{ width: `${registeredCount > 0 ? (presentCount / registeredCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#000] border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col h-[520px]">
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              Live Entry Log
            </h4>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 corporate-scrollbar">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-white/[0.02] rounded-xl border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : attendance.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <LucideIcon name="users" className="w-12 h-12 mb-4 stroke-[1px]" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Waiting for entries...</p>
                </div>
              ) : (
                attendance.map((record) => (
                  <div 
                    key={record._id} 
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-300 group",
                      record.attended 
                        ? "bg-emerald-500/[0.03] border-emerald-500/20 shadow-lg" 
                        : "bg-white/[0.01] border-white/5 opacity-50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                          record.attended ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-white/5 border-white/10 text-white/20"
                        )}>
                          <LucideIcon name="user" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white uppercase tracking-tight truncate group-hover:text-emerald-500 transition-colors">{record.userName}</p>
                          <p className="text-[9px] font-medium text-white/30 truncate uppercase tracking-widest mt-0.5">{record.userEmail}</p>
                        </div>
                      </div>
                      {record.attended && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <LucideIcon name="check" className="w-3 h-3 text-emerald-500 stroke-[3px]" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
