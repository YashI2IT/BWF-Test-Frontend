import { MoreHorizontal } from "lucide-react";

export default function StatCard({ title, value, date, color }: any) {
  return (
    <div className={`${color} p-6 rounded-[32px] shadow-sm flex flex-col justify-between min-h-[160px] relative overflow-hidden group border border-white/20`}>
      <div className="flex justify-between items-start z-10">
        <span className="text-[10px] font-bold bg-white/50 px-3 py-1 rounded-full uppercase tracking-widest text-black/60">
          {date}
        </span>
        <button className="text-black/40 hover:text-black">
            <MoreHorizontal size={20} />
        </button>
      </div>
      
      <div className="z-10 mt-4">
        <h2 className="text-3xl font-black text-black mb-1">{value}</h2>
        <p className="text-sm font-bold text-black/60 uppercase tracking-tighter">{title}</p>
      </div>

      <div className="mt-4 w-full bg-white/30 h-1.5 rounded-full overflow-hidden">
         <div className="bg-black h-full w-[70%]" />
      </div>
    </div>
  );
}
