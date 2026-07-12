export default function ActivityChart() {
  const bars = [40, 75, 50, 90, 65, 80, 45, 60, 85, 30, 55, 70];
  
  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-50">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h3 className="text-xl font-bold">Occupancy Rate</h3>
            <p className="text-xs text-gray-400 font-medium">Yearly performance overview</p>
        </div>
        <select className="bg-gray-50 border-none rounded-xl text-xs font-bold p-2 outline-none cursor-pointer">
            <option>Last 12 Months</option>
        </select>
      </div>

      <div className="h-48 flex items-end justify-between gap-2">
        {bars.map((h, i) => (
          <div key={i} className="group relative flex-1 flex flex-col items-center">
            <div 
                className="w-full bg-[#f3f6f4] rounded-full relative overflow-hidden flex items-end h-40"
            >
                <div 
                    className="w-full bg-green-400 rounded-full transition-all duration-700 ease-out group-hover:bg-green-500" 
                    style={{ height: `${h}%` }}
                />
            </div>
            <span className="text-[10px] font-bold text-gray-300 mt-3">M{i+1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
