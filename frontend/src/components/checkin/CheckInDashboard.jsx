import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Clock } from "lucide-react";

export default function CheckInDashboard() {
  const [stats, setStats] = useState({
    todayByType: {
      BFP: 0,
      "Fire Brigade": 0,
      "Fire Volunteer": 0,
      PNP: 0,
      DRRMO: 0,
    },
    onDutyByType: {
      BFP: 0,
      "Fire Brigade": 0,
      "Fire Volunteer": 0,
      PNP: 0,
      DRRMO: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [checkins, personnel] = await Promise.all([
          base44.entities.CheckIn.list(),
          base44.entities.Personnel.list(),
        ]);

        const personnelMap = personnel.reduce((acc, p) => {
          acc[p.id] = {
            type: p.personnel_type || "BFP",
            dutyStatus: p.duty_status,
          };
          return acc;
        }, {});

        const todayByType = {
          BFP: 0,
          "Fire Brigade": 0,
          "Fire Volunteer": 0,
          PNP: 0,
          DRRMO: 0,
        };

        const onDutyByType = {
          BFP: 0,
          "Fire Brigade": 0,
          "Fire Volunteer": 0,
          PNP: 0,
          DRRMO: 0,
        };

        const today = new Date().toDateString();

        checkins.forEach((checkin) => {
          const personInfo = personnelMap[checkin.personnel_id];
          if (!personInfo) return;

          const type = personInfo.type;

          // Count today's check-ins (excluding check-outs)
          if (
            checkin.check_in_time &&
            new Date(checkin.check_in_time).toDateString() === today &&
            checkin.type !== "Check-Out"
          ) {
            todayByType[type]++;
          }
        });

        // Count on-duty personnel
        personnel.forEach((p) => {
          if (p.duty_status === "On Duty") {
            const type = p.personnel_type || "BFP";
            onDutyByType[type]++;
          }
        });

        setStats({ todayByType, onDutyByType });
      } catch (error) {
        console.error("Error fetching check-in dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const colorMap = {
    BFP: "bg-blue-600/20 border-blue-600/40 text-blue-400",
    "Fire Brigade": "bg-yellow-600/20 border-yellow-600/40 text-yellow-400",
    "Fire Volunteer": "bg-purple-600/20 border-purple-600/40 text-purple-400",
    PNP: "bg-green-600/20 border-green-600/40 text-green-400",
    DRRMO: "bg-orange-600/20 border-orange-600/40 text-orange-400",
  };

  const totalToday = Object.values(stats.todayByType).reduce((a, b) => a + b, 0);
  const totalOnDuty = Object.values(stats.onDutyByType).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading check-in data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Check-ins */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Clock className="w-3.5 h-3.5" /> Today's Check-ins by Type
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(stats.todayByType).map(([type, count]) => (
            <div
              key={`today-${type}`}
              className={`rounded-lg border p-3 text-center ${colorMap[type]}`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs mt-1 opacity-75">{type}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
          <div className="text-center">
            <span className="text-gray-500 text-xs">Total Check-ins Today</span>
            <div className="text-3xl font-bold text-white mt-1">{totalToday}</div>
          </div>
        </div>
      </div>

      {/* On-Duty Personnel */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Users className="w-3.5 h-3.5" /> On-Duty Personnel by Type
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(stats.onDutyByType).map(([type, count]) => (
            <div
              key={`duty-${type}`}
              className={`rounded-lg border p-3 text-center ${colorMap[type]}`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs mt-1 opacity-75">{type}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
          <div className="text-center">
            <span className="text-gray-500 text-xs">Total On-Duty Personnel</span>
            <div className="text-3xl font-bold text-white mt-1">{totalOnDuty}</div>
          </div>
        </div>
      </div>
    </div>
  );
}