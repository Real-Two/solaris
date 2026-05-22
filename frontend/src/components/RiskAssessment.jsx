import React, { useState } from 'react';
import { getDecisionColor, getDecisionIcon } from '../services/decisionEngine';

export default function RiskAssessment({ flight, seuRisk, decision }) {
  const [expandedReasoning, setExpandedReasoning] = useState(false);

  if (!decision) return null;

  const isRecommended = (type) => decision.decision === type;

  return (
    <div className="mt-4 border-t border-[rgba(255,255,255,0.1)] pt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[#a0aec0] text-[10px] tracking-widest uppercase font-bold">SOLARIS Decision Matrix</h3>
        <div className="flex items-center gap-2">
           <span className="text-[12px] text-white">Confidence:</span>
           <span className="text-[12px] font-bold" style={{ color: getDecisionColor(decision.decision) }}>{decision.confidence}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* GO Card */}
        <div className={`p-3 rounded-lg border ${isRecommended('GO') ? 'bg-[#00ff88]/10 border-[#00ff88]' : 'bg-[#0f1535] border-white/5 opacity-50'} transition-all`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px]" style={{color: '#00ff88'}}>✓</span>
            <span className="text-[12px] font-bold text-white tracking-wider">GO</span>
          </div>
          <p className="text-[10px] text-[#a0aec0] leading-tight">Proceed as planned</p>
          {isRecommended('GO') && (
            <div className="mt-2 pt-2 border-t border-[#00ff88]/20">
               <span className="text-[9px] text-[#00ff88]/80 block mb-1">RECOMMENDED</span>
               <p className="text-[10px] text-white/90">{decision.action}</p>
            </div>
          )}
        </div>

        {/* DEVIATE Card */}
        <div className={`p-3 rounded-lg border ${isRecommended('DEVIATE') ? 'bg-[#00d4ff]/10 border-[#00d4ff]' : 'bg-[#0f1535] border-white/5 opacity-50'} transition-all`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px]" style={{color: '#00d4ff'}}>⤴</span>
            <span className="text-[12px] font-bold text-white tracking-wider">DEVIATE</span>
          </div>
          <p className="text-[10px] text-[#a0aec0] leading-tight">Reroute recommended</p>
          {isRecommended('DEVIATE') && (
            <div className="mt-2 pt-2 border-t border-[#00d4ff]/20">
               <span className="text-[9px] text-[#00d4ff]/80 block mb-1">RECOMMENDED</span>
               <p className="text-[10px] text-white/90">{decision.action}</p>
            </div>
          )}
        </div>

        {/* NO-GO Card */}
        <div className={`p-3 rounded-lg border ${isRecommended('NO-GO') ? 'bg-[#ff4444]/10 border-[#ff4444]' : 'bg-[#0f1535] border-white/5 opacity-50'} transition-all`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px]" style={{color: '#ff4444'}}>⊗</span>
            <span className="text-[12px] font-bold text-white tracking-wider">NO-GO</span>
          </div>
          <p className="text-[10px] text-[#a0aec0] leading-tight">Reschedule flight</p>
          {isRecommended('NO-GO') && (
            <div className="mt-2 pt-2 border-t border-[#ff4444]/20">
               <span className="text-[9px] text-[#ff4444]/80 block mb-1">RECOMMENDED</span>
               <p className="text-[10px] text-white/90">{decision.action}</p>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => setExpandedReasoning(!expandedReasoning)}
        className="mt-3 w-full text-left p-3 rounded-lg bg-[#0f1535] border border-white/5 hover:bg-white/5 transition-colors flex justify-between items-center"
      >
        <span className="text-[11px] text-[#a0aec0]">Detailed Reasoning</span>
        <span className="text-[#a0aec0]">{expandedReasoning ? '−' : '+'}</span>
      </button>

      {expandedReasoning && (
        <div className="mt-2 p-3 rounded-lg bg-[#0f1535] border border-white/10">
          <p className="text-[12px] text-white mb-3">{decision.reason}</p>
          
          <div className="space-y-2">
             <div className="flex justify-between border-b border-white/5 pb-1">
                 <span className="text-[11px] text-[#a0aec0]">Risk Score</span>
                 <span className="text-[11px] text-white">{seuRisk.score.toFixed(1)}%</span>
             </div>
             
             {decision.details.fuelImpact && (
               <div className="flex justify-between border-b border-white/5 pb-1">
                   <span className="text-[11px] text-[#a0aec0]">Est. Fuel Impact</span>
                   <span className="text-[11px] text-white">{decision.details.fuelImpact}</span>
               </div>
             )}
             
             {decision.details.timeImpact && (
               <div className="flex justify-between border-b border-white/5 pb-1">
                   <span className="text-[11px] text-[#a0aec0]">Est. Time Impact</span>
                   <span className="text-[11px] text-white">{decision.details.timeImpact}</span>
               </div>
             )}
             
             {decision.details.riskReduction && (
               <div className="flex justify-between border-b border-white/5 pb-1">
                   <span className="text-[11px] text-[#a0aec0]">Risk Reduction</span>
                   <span className="text-[11px] text-[#00ff88]">{decision.details.riskReduction}</span>
               </div>
             )}
          </div>
          
          {decision.details.alternatives && (
              <div className="mt-3">
                  <span className="text-[10px] text-[#a0aec0] uppercase tracking-wider block mb-1">Alternatives</span>
                  <ul className="list-disc pl-4 text-[11px] text-white/80 space-y-1">
                      {decision.details.alternatives.map((alt, i) => <li key={i}>{alt}</li>)}
                  </ul>
              </div>
          )}
        </div>
      )}
      
      {/* Philosophy Panel */}
      <div className="mt-4 p-3 rounded-lg border border-[#00d4ff]/20 bg-[linear-gradient(135deg,rgba(0,212,255,0.05),rgba(0,0,0,0))]">
         <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px]">ℹ</span>
            <span className="text-[10px] uppercase tracking-widest text-[#00d4ff] font-bold">Decision Philosophy</span>
         </div>
         <ul className="text-[10px] text-[#a0aec0] space-y-1">
            <li>✓ Safety First — Passenger and crew protection</li>
            <li>✓ Sustainability — Prevent emergency diversions (saving CO₂)</li>
            <li>✓ Cost-Effective — Planned deviations vs reactive landings</li>
         </ul>
      </div>
    </div>
  );
}
