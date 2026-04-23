import Image from "next/image";
import { MapPin, Phone } from "lucide-react";

export default function Footer({ showSupportInfo = true }: { showSupportInfo?: boolean }) {
  const handleScrollToTop = () => {
    if (typeof window !== 'undefined') {
      document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#000] border-t border-white/5 pt-12 pb-6">
      <div className="w-full px-6 lg:px-20 mx-auto max-w-none">
        <div className="flex flex-col lg:flex-row items-start lg:justify-between gap-10 lg:gap-4 mb-12">
          {/* Logo Section */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative w-10 h-10">
              <Image src="/CloudSpace_Logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase mb-0">
              CNT <span className="text-[#ed1c24]">CLOUDSPACE</span>
            </span>
          </div>
          
          {/* Office Address Section */}
          <div className="space-y-4 pt-1 w-full lg:w-68">
            <h4 className="text-[#ed1c24] font-black uppercase tracking-widest text-[11px] opacity-80">Office Address</h4>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#ed1c24] mt-0.5 shrink-0" />
              <p className="text-white/40 font-black text-[12px] leading-relaxed w-full max-w-none tracking-tight">
                LYFE Tower, 219 Shaw Blvd. cor. E. Jacinto St., Brgy. Bagong Silang, Mandaluyong City
              </p>
            </div>
          </div>

          {/* Features Column */}
          <div className="space-y-4 pt-1 w-full lg:w-auto">
            <h4 className="text-[#ed1c24] font-black uppercase tracking-widest text-[11px] opacity-80">Features</h4>
            <ul className="space-y-3">
              <li><a href="/helpdesk" className="text-white/40 hover:text-white transition-colors font-black text-[11px] uppercase tracking-widest block">IT Helpdesk</a></li>
              <li><a href="/chat" className="text-white/40 hover:text-white transition-colors font-black text-[11px] uppercase tracking-widest block">Secure Chat</a></li>
              <li><a href="/pulse" className="text-white/40 hover:text-white transition-colors font-black text-[11px] uppercase tracking-widest block">Pulse</a></li>
            </ul>
          </div>

          {/* Why CNT Column */}
          <div className="space-y-4 pt-1 w-full lg:w-auto">
            <h4 className="text-[#ed1c24] font-black uppercase tracking-widest text-[11px] opacity-80">Why CNT?</h4>
            <ul className="space-y-3">
              <li><span className="text-white/40 font-black text-[11px] uppercase tracking-widest block">The CloudSpace Advantage</span></li>
              <li><span className="text-white/40 font-black text-[11px] uppercase tracking-widest block">Innovation & Efficiency</span></li>
              <li>
                <a 
                  href="/about"
                  className="text-white/40 hover:text-white transition-colors font-black text-[11px] uppercase tracking-widest text-left block"
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          {showSupportInfo && (
            <div className="space-y-4 shrink-0 pt-1 w-full lg:w-auto">
              <h4 className="text-[#ed1c24] font-black uppercase tracking-widest text-[11px] opacity-80">Need Help?</h4>
              <ul className="space-y-3">
                <li className="text-white/40 font-black text-[11px] uppercase tracking-widest block">
                  <a href="https://itcntpromoads.on.spiceworks.com/portal/registrations" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#ed1c24] transition-colors font-black">Submit Ticket <span className="text-white/40 font-black"> or Email</span></a>
                </li>
                <li className="block">
                  <a href="mailto:help@itcntpromoads.on.spiceworks.com" className="text-white hover:text-[#ed1c24] transition-colors font-black break-all text-[11px] sm:text-xs">
                    help@itcntpromoads.on.
                    <br className="sm:hidden" />
                    spiceworks.com
                  </a>
                </li>
                <li className="text-white/40 font-black text-[11px] uppercase tracking-widest block">
                  or Call IT Hotline <span className="text-white font-black">EXT 122</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-center items-center gap-4">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} CNT CLOUDSPACE
          </p>
        </div>
      </div>
    </footer>
  );
}
