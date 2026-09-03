import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Sliders, Clock, ShieldAlert } from 'lucide-react';

interface TimelineEvent {
  id: string;
  time: string;
  type: 'VITAL_RECORDED' | 'ALERT_GENERATED' | 'ALERT_ACKNOWLEDGED' | 'PLAN_UPDATED' | 'OBSERVATION_MISSED';
  title: string;
  actor: string;
  details: string;
}

interface ClinicalTimelineProps {
  events?: TimelineEvent[];
}

export const ClinicalTimeline: React.FC<ClinicalTimelineProps> = ({ events }) => {
  const defaultEvents: TimelineEvent[] = [
    {
      id: 'evt-1',
      time: '18:05',
      type: 'ALERT_GENERATED',
      title: 'CRITICAL Alert Generated — SpO2 88%',
      actor: 'System AI Engine',
      details: 'SpO2 dropped below 90% threshold. Instant escalation protocol initiated.'
    },
    {
      id: 'evt-2',
      time: '18:05',
      type: 'VITAL_RECORDED',
      title: 'Bedside Observation Recorded',
      actor: 'Marcus Chen, RN',
      details: 'HR 124 bpm, BP 92/58 mmHg, Temp 39.1°C, SpO2 88%. High flow O2 administered.'
    },
    {
      id: 'evt-3',
      time: '17:52',
      type: 'ALERT_ACKNOWLEDGED',
      title: 'Tachycardia Warning Acknowledged',
      actor: 'Dr. Ananya Sharma',
      details: 'Doctor reviewed telemetry and ordered immediate arterial blood gas (ABG) test.'
    },
    {
      id: 'evt-4',
      time: '16:30',
      type: 'PLAN_UPDATED',
      title: 'Monitoring Plan Modified',
      actor: 'Dr. Ananya Sharma',
      details: 'Escalated heart rate and SpO2 observation frequency from q1h to q15m.'
    },
    {
      id: 'evt-5',
      time: '14:00',
      type: 'VITAL_RECORDED',
      title: 'Routine Hourly Observation',
      actor: 'Sarah Jenkins, RN',
      details: 'HR 102 bpm, BP 115/72 mmHg, Temp 38.2°C, SpO2 93%.'
    }
  ];

  const list = events || defaultEvents;

  const getEventBadge = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'ALERT_GENERATED':
        return { icon: AlertTriangle, bg: 'bg-rose-100 text-rose-700 border-rose-300' };
      case 'ALERT_ACKNOWLEDGED':
        return { icon: CheckCircle2, bg: 'bg-amber-100 text-amber-700 border-amber-300' };
      case 'VITAL_RECORDED':
        return { icon: Activity, bg: 'bg-cyan-100 text-cyan-700 border-cyan-300' };
      case 'PLAN_UPDATED':
        return { icon: Sliders, bg: 'bg-blue-100 text-blue-700 border-blue-300' };
      case 'OBSERVATION_MISSED':
        return { icon: Clock, bg: 'bg-orange-100 text-orange-700 border-orange-300' };
      default:
        return { icon: Activity, bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {list.map((evt, idx) => {
          const badge = getEventBadge(evt.type);
          const Icon = badge.icon;
          const isLast = idx === list.length - 1;

          return (
            <li key={evt.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3 items-start">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center border ${badge.bg}`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between text-xs">
                      <p className="font-bold text-slate-900">{evt.title}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{evt.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{evt.details}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                      <span>By:</span>
                      <span className="text-slate-700 font-bold">{evt.actor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
