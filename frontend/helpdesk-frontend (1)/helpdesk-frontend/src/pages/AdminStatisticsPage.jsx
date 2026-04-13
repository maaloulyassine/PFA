import React, { useEffect, useState } from "react";
import { statsAPI } from "../utils/api";

const CHART_COLORS = ["#4f8ef7", "#e74c3c", "#f39c12", "#27ae60", "#7c5cbf", "#e67e22"];

export default function AdminStatisticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsAPI.getGlobal(),
      statsAPI.getTicketsByPriority(),
      statsAPI.getTicketsByCategory(),
      statsAPI.getTechnicianPerformance(),
    ]).then(([global, priority, category, technicians]) => {
      setData({ global: global.data, priority: priority.data, category: category.data, technicians: technicians.data });
    }).catch(() => {
      setData(DEMO_DATA);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Chargement des statistiques…</div>;

  const { global: g, priority: pData, category: cData, technicians: tData } = data;

  const maxPriority = Math.max(...(pData || []).map((d) => d.count), 1);
  const maxCat = Math.max(...(cData || []).map((d) => d.count), 1);

  return (
    <div className="stats-page">
      <div className="page-header">
        <h1>Statistiques & KPIs</h1>
        <span className="subtitle">Vue globale des performances du support IT</span>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard label="Total tickets" value={g?.totalTickets || 0} icon="🎫" sub="toutes périodes" color="#4f8ef7" />
        <KPICard label="Tickets ouverts" value={g?.openTickets || 0} icon="🔓" sub="en attente" color="#e74c3c" />
        <KPICard label="Résolus aujourd'hui" value={g?.resolvedToday || 0} icon="✅" sub="dernières 24h" color="#27ae60" />
        <KPICard label="Délai moyen résolution" value={`${g?.avgResolutionHours?.toFixed(1) || "—"} h`} icon="⏱" sub="par ticket" color="#f39c12" />
        <KPICard label="Taux de résolution" value={`${g?.resolutionRate?.toFixed(0) || 0}%`} icon="📈" sub="tickets résolus/total" color="#7c5cbf" />
        <KPICard label="Satisfaction" value={`${g?.satisfactionRate?.toFixed(0) || "—"}%`} icon="⭐" sub="évaluation post-résolution" color="#e67e22" />
      </div>

      <div className="charts-grid">
        {/* Priority Bar Chart */}
        <div className="chart-card">
          <h2>Tickets par priorité</h2>
          <div className="bar-chart">
            {(pData || []).map((d, i) => (
              <div key={d.priority} className="bar-row">
                <div className="bar-label">{d.priority}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(d.count / maxPriority) * 100}%`, background: CHART_COLORS[i] }} />
                </div>
                <div className="bar-value">{d.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category chart */}
        <div className="chart-card">
          <h2>Tickets par catégorie</h2>
          <div className="bar-chart">
            {(cData || []).map((d, i) => (
              <div key={d.category} className="bar-row">
                <div className="bar-label">{d.category}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(d.count / maxCat) * 100}%`, background: CHART_COLORS[i] }} />
                </div>
                <div className="bar-value">{d.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technician Performance Table */}
      <div className="perf-card">
        <h2>Performance des techniciens</h2>
        <table className="perf-table">
          <thead>
            <tr><th>Technicien</th><th>Spécialité</th><th>Tickets assignés</th><th>Résolus</th><th>Taux résolution</th><th>Délai moyen</th></tr>
          </thead>
          <tbody>
            {(tData || []).map((t) => {
              const rate = t.assigned > 0 ? ((t.resolved / t.assigned) * 100).toFixed(0) : 0;
              return (
                <tr key={t.id}>
                  <td>{t.firstName} {t.lastName}</td>
                  <td><span className="spec-badge">{t.specialty || "—"}</span></td>
                  <td>{t.assigned}</td>
                  <td>{t.resolved}</td>
                  <td>
                    <div className="rate-bar-wrapper">
                      <div className="rate-bar" style={{ width: `${rate}%`, background: rate >= 80 ? "#27ae60" : rate >= 50 ? "#f39c12" : "#e74c3c" }} />
                      <span className="rate-label">{rate}%</span>
                    </div>
                  </td>
                  <td>{t.avgHours?.toFixed(1) || "—"} h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .stats-page { max-width: 1200px; }
        .page-header { margin-bottom: 28px; }
        .page-header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
        .subtitle { color: #6e7491; font-size: 13.5px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        @media (max-width: 800px) { .charts-grid { grid-template-columns: 1fr; } }
        .chart-card, .perf-card { background: #1a1d27; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 22px; }
        .chart-card h2, .perf-card h2 { font-size: 15px; font-weight: 600; margin-bottom: 20px; }
        .bar-chart { display: flex; flex-direction: column; gap: 12px; }
        .bar-row { display: flex; align-items: center; gap: 12px; }
        .bar-label { min-width: 80px; font-size: 12.5px; color: #a0a3b1; text-align: right; }
        .bar-track { flex: 1; background: rgba(255,255,255,0.06); border-radius: 4px; height: 22px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
        .bar-value { min-width: 30px; font-size: 13px; font-weight: 600; color: #e8eaf0; }
        .perf-table { width: 100%; border-collapse: collapse; }
        .perf-table th { padding: 10px 14px; text-align: left; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #6e7491; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .perf-table td { padding: 11px 14px; font-size: 13.5px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .perf-table tr:last-child td { border-bottom: none; }
        .spec-badge { background: rgba(255,255,255,0.07); color: #a0a3b1; font-size: 11.5px; padding: 3px 9px; border-radius: 6px; }
        .rate-bar-wrapper { display: flex; align-items: center; gap: 8px; }
        .rate-bar { height: 8px; border-radius: 4px; min-width: 4px; }
        .rate-label { font-size: 12px; font-weight: 600; color: #e8eaf0; min-width: 36px; }
        .loading-state { display: flex; align-items: center; justify-content: center; height: 60vh; color: #6e7491; font-size: 16px; }
      `}</style>
    </div>
  );
}

function KPICard({ label, value, icon, sub, color }) {
  return (
    <div style={{ background: "#1a1d27", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#e8eaf0", marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: "#6e7491" }}>{sub}</div>
    </div>
  );
}

const DEMO_DATA = {
  global: { totalTickets: 145, openTickets: 32, resolvedToday: 8, avgResolutionHours: 6.4, resolutionRate: 78, satisfactionRate: 84 },
  priority: [
    { priority: "CRITIQUE", count: 18 }, { priority: "ELEVEE", count: 34 },
    { priority: "MOYENNE", count: 57 }, { priority: "FAIBLE", count: 36 }
  ],
  category: [
    { category: "Réseau", count: 52 }, { category: "Logiciel", count: 41 },
    { category: "Matériel", count: 33 }, { category: "Sécurité", count: 19 }
  ],
  technicians: [
    { id: 1, firstName: "Mohamed", lastName: "Trabelsi", specialty: "Réseau", assigned: 28, resolved: 24, avgHours: 4.2 },
    { id: 2, firstName: "Sana", lastName: "Belhaj", specialty: "Logiciel", assigned: 21, resolved: 15, avgHours: 7.8 },
    { id: 3, firstName: "Youssef", lastName: "Gharbi", specialty: "Matériel", assigned: 17, resolved: 14, avgHours: 5.1 },
    { id: 4, firstName: "Rim", lastName: "Chaabane", specialty: "Sécurité", assigned: 12, resolved: 11, avgHours: 3.3 },
  ]
};
