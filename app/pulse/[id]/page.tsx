import Header from "@/components/Header";
import LucideIcon from "@/components/LucideIcon";

export default function BulletinPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="min-h-screen bg-[#000] flex flex-col">
      <Header />
      <div className="flex-1 pt-20 px-4 pb-4">
        <div className="w-full h-full max-w-7xl mx-auto bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <LucideIcon name="loader-2" className="w-12 h-12 text-[#ed1c24] animate-spin" />
              <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Loading Secure Document...</p>
            </div>
          </div>
          <iframe 
            src={`/api/file/${id}`} 
            className="w-full h-[calc(100vh-120px)] border-none"
            title="Official Memorandum"
          />
        </div>
      </div>
    </div>
  );
}
