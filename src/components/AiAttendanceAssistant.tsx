import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  AlertTriangle,
  FileSpreadsheet,
  Send,
  Loader2,
  RefreshCw,
  TrendingDown,
  ShieldAlert,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';
import { apiAi } from '../services/api';

export const AiAttendanceAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'briefing' | 'truancy' | 'query'>('briefing');

  // Executive Briefing state
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingMetrics, setBriefingMetrics] = useState<any>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  // Truancy state
  const [truancyData, setTruancyData] = useState<any | null>(null);
  const [loadingTruancy, setLoadingTruancy] = useState(false);

  // Query state
  const [userQuery, setUserQuery] = useState('');
  const [queryAnswer, setQueryAnswer] = useState<string | null>(null);
  const [loadingQuery, setLoadingQuery] = useState(false);

  const fetchBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const res = await apiAi.getExecutiveSummary();
      setBriefing(res.summary);
      setBriefingMetrics(res.metrics);
    } catch (err: any) {
      console.error('Error fetching briefing:', err);
    } finally {
      setLoadingBriefing(false);
    }
  };

  const fetchTruancy = async () => {
    setLoadingTruancy(true);
    try {
      const res = await apiAi.getTruancyRisk();
      setTruancyData(res);
    } catch (err: any) {
      console.error('Error fetching truancy data:', err);
    } finally {
      setLoadingTruancy(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'briefing' && !briefing) {
      fetchBriefing();
    } else if (activeTab === 'truancy' && !truancyData) {
      fetchTruancy();
    }
  }, [activeTab]);

  const handleRunQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || loadingQuery) return;

    setLoadingQuery(true);
    setQueryAnswer(null);

    try {
      const res = await apiAi.query(userQuery.trim());
      setQueryAnswer(res.answer);
    } catch (err: any) {
      setQueryAnswer(`Error processing query: ${err.message}`);
    } finally {
      setLoadingQuery(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-[#0C4A34] to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-amber-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Limbando AI Attendance Intelligence
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-blue-950">
                Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Automated executive briefings, predictive truancy early warning, and natural language analytics
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('briefing')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'briefing' ? 'bg-white text-blue-950 shadow-xs' : 'text-blue-200 hover:text-white'
            }`}
          >
            Executive Briefing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('truancy')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'truancy' ? 'bg-white text-blue-950 shadow-xs' : 'text-blue-200 hover:text-white'
            }`}
          >
            Truancy Predictor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('query')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'query' ? 'bg-white text-blue-950 shadow-xs' : 'text-blue-200 hover:text-white'
            }`}
          >
            Ask AI Assistant
          </button>
        </div>
      </div>

      {/* Tab 1: Executive Briefing */}
      {activeTab === 'briefing' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              Generated from real-time biometric and QR gate entrance telemetry
            </div>
            <button
              onClick={fetchBriefing}
              disabled={loadingBriefing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBriefing ? 'animate-spin' : ''}`} />
              <span>Regenerate Briefing</span>
            </button>
          </div>

          {loadingBriefing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#0C4A34]" />
              <div className="text-xs font-bold text-neutral-700">Synthesizing Executive Attendance Briefing...</div>
              <div className="text-[11px] text-neutral-400">Analyzing cohorts, arrival times, and class rates</div>
            </div>
          ) : briefing ? (
            <div className="prose prose-sm max-w-none text-neutral-800 text-xs leading-relaxed bg-[#F9F9F9] p-4.5 rounded-xl border border-neutral-200 whitespace-pre-line">
              {briefing}
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Truancy & At-Risk Predictor */}
      {activeTab === 'truancy' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-neutral-900">Attendance Risk Flagging & Early Intervention</h3>
              <p className="text-[11px] text-neutral-500">Identifies chronic dropouts before they fall below state standards</p>
            </div>
            <button
              onClick={fetchTruancy}
              disabled={loadingTruancy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTruancy ? 'animate-spin' : ''}`} />
              <span>Recalculate Risk</span>
            </button>
          </div>

          {loadingTruancy ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#0C4A34]" />
              <div className="text-xs font-bold text-neutral-700">Analyzing Historical Attendance Trajectories...</div>
            </div>
          ) : truancyData ? (
            <div className="space-y-4">
              {/* Stat Pills */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                  <div className="text-xl font-bold text-red-700">{truancyData.highRiskCount}</div>
                  <div className="text-[11px] font-semibold text-red-900">High Risk Pupils</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <div className="text-xl font-bold text-amber-700">{truancyData.moderateRiskCount}</div>
                  <div className="text-[11px] font-semibold text-amber-900">Moderate Risk Pupils</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <div className="text-xl font-bold text-emerald-800">
                    {truancyData.pupils.length - truancyData.atRiskCount}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-950">Normal Attendance</div>
                </div>
              </div>

              {/* Counselor Directive */}
              {truancyData.aiEvaluation && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900 mb-1">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>Welfare Committee Intervention Directive:</span>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed">{truancyData.aiEvaluation}</div>
                </div>
              )}

              {/* At-risk student list */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 text-neutral-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Pupil Name</th>
                      <th className="p-2.5">Student ID</th>
                      <th className="p-2.5">Cohort</th>
                      <th className="p-2.5">Absences</th>
                      <th className="p-2.5">Late Gate Arrivals</th>
                      <th className="p-2.5">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {truancyData.pupils.slice(0, 8).map((p: any) => (
                      <tr key={p.id} className="hover:bg-neutral-50">
                        <td className="p-2.5 font-bold text-neutral-900">{p.name}</td>
                        <td className="p-2.5 font-mono text-neutral-500">{p.studentId}</td>
                        <td className="p-2.5">Grade {p.grade} - {p.class}</td>
                        <td className="p-2.5 font-bold text-red-600">{p.absences} days</td>
                        <td className="p-2.5 text-amber-700">{p.totalLate} days</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.riskLevel === 'HIGH'
                                ? 'bg-red-100 text-red-800'
                                : p.riskLevel === 'MODERATE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.riskLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 3: Natural Language Query Assistant */}
      {activeTab === 'query' && (
        <div className="p-5 space-y-4">
          <form onSubmit={handleRunQuery} className="flex gap-2">
            <input
              type="text"
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              placeholder="e.g. Which Grade 11 class has the best attendance rate this month?"
              className="flex-1 px-3.5 py-2.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={loadingQuery || !userQuery.trim()}
              className="px-4 py-2.5 bg-[#0C4A34] text-white rounded-xl text-xs font-bold hover:bg-[#083827] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingQuery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Ask AI</span>
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 text-[11px] text-neutral-600">
            <span className="font-semibold text-neutral-500 py-0.5">Try asking:</span>
            {[
              'Show me all Grade 12 pupils',
              'Who had late arrivals today?',
              'Compare attendance between Class A and B',
            ].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setUserQuery(q);
                }}
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Query Response */}
          {loadingQuery && (
            <div className="p-6 text-center space-y-2 bg-[#F9F9F9] rounded-xl border border-neutral-200">
              <Loader2 className="w-6 h-6 animate-spin text-[#0C4A34] mx-auto" />
              <div className="text-xs text-neutral-600">Querying school database and generating insights...</div>
            </div>
          )}

          {queryAnswer && !loadingQuery && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-neutral-900 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Bot className="w-4 h-4" />
                <span>AI Assistant Answer:</span>
              </div>
              <div className="whitespace-pre-line leading-relaxed">{queryAnswer}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
