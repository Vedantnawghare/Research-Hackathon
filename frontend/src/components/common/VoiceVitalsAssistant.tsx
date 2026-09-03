import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, CheckCircle2, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ParsedVitals {
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
  spo2?: number;
  glucose?: number;
  temperature?: number;
  respiratoryRate?: number;
  urineOutput?: number;
}

interface VoiceVitalsAssistantProps {
  onVitalsParsed: (parsed: ParsedVitals, transcriptText: string) => void;
}

export const VoiceVitalsAssistant: React.FC<VoiceVitalsAssistantProps> = ({ onVitalsParsed }) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [lastParsedSummary, setLastParsedSummary] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Comprehensive Medical Speech NLP Extractor
  const parseFullVoiceTranscript = (fullText: string): ParsedVitals => {
    const lower = fullText.toLowerCase();
    const result: ParsedVitals = {};

    // 1. Joint BP: "BP 120 80", "120 over 80", "120/80"
    const bpJointMatch =
      lower.match(/(?:bp|blood pressure)\s*(\d{2,3})[\s\/\-_]+(?:over\s*)?(\d{2,3})/) ||
      lower.match(/(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})/);

    if (bpJointMatch) {
      result.systolic = parseInt(bpJointMatch[1], 10);
      result.diastolic = parseInt(bpJointMatch[2], 10);
    }

    // Individual Systolic BP: "systolic BP 120", "systolic 120", "sys 120"
    const sysMatch = lower.match(/(?:systolic\s*bp|systolic|sys)\s*(\d{2,3})/);
    if (sysMatch && !result.systolic) {
      result.systolic = parseInt(sysMatch[1], 10);
    }

    // Individual Diastolic BP: "diastolic BP 80", "diastolic 80", "dia 80"
    const diaMatch = lower.match(/(?:diastolic\s*bp|diastolic|dia)\s*(\d{2,3})/);
    if (diaMatch && !result.diastolic) {
      result.diastolic = parseInt(diaMatch[1], 10);
    }

    // 2. Heart Rate / Pulse / BPM: "heart rate 95", "pulse 95", "hr 95", "95 bpm", "bpm 95"
    const hrMatch =
      lower.match(/(?:heart\s*rate|pulse|hr|heartrate)\s*(\d{2,3})/) ||
      lower.match(/(\d{2,3})\s*bpm/) ||
      lower.match(/bpm\s*(\d{2,3})/);

    if (hrMatch) {
      result.heartRate = parseInt(hrMatch[1], 10);
    }

    // 3. SpO2 / Oxygen Saturation: "oxygen saturation 97", "spo2 97", "oxygen 97"
    const spo2Match = lower.match(/(?:spo2|sp o2|oxygen\s*saturation|oxygen|o2|sat)\s*(\d{2,3})/);
    if (spo2Match) {
      result.spo2 = parseInt(spo2Match[1], 10);
    }

    // 4. Glucose / Sugar: "sugar 140", "glucose 140", "blood sugar 140"
    const glucoseMatch = lower.match(/(?:sugar|glucose|blood sugar)\s*(\d{2,3})/);
    if (glucoseMatch) {
      result.glucose = parseInt(glucoseMatch[1], 10);
    }

    // 5. Body Temperature: "body temperature 37", "temperature 37", "temp 37"
    const tempMatch = lower.match(/(?:body\s*temperature|temperature|temp|fever)\s*(\d{2}(?:\.\d)?)/);
    if (tempMatch) {
      result.temperature = parseFloat(tempMatch[1]);
    }

    // 6. Respiratory Rate: "respiration rate 16", "respiratory rate 16", "respiration 16", "rr 16"
    const rrMatch = lower.match(/(?:respiration\s*rate|respiratory\s*rate|respiration|breathing|rr)\s*(\d{1,2})/);
    if (rrMatch) {
      result.respiratoryRate = parseInt(rrMatch[1], 10);
    }

    // 7. Urine Output: "urine output 35", "urine 35", "urine output 40 ml", "output 35"
    const urineMatch = lower.match(/(?:urine\s*output|urine|urine\s*flow|output)\s*(\d{1,3})/);
    if (urineMatch) {
      result.urineOutput = parseInt(urineMatch[1], 10);
    }

    return result;
  };

  const processAndCommitTranscript = (text: string) => {
    if (!text.trim()) return;

    const parsed = parseFullVoiceTranscript(text);
    if (Object.keys(parsed).length > 0) {
      onVitalsParsed(parsed, text);

      const summaryParts = [];
      if (parsed.heartRate) summaryParts.push(`HR: ${parsed.heartRate} bpm`);
      if (parsed.spo2) summaryParts.push(`SpO₂: ${parsed.spo2}%`);
      if (parsed.systolic || parsed.diastolic) summaryParts.push(`BP: ${parsed.systolic || '—'}/${parsed.diastolic || '—'}`);
      if (parsed.temperature) summaryParts.push(`Temp: ${parsed.temperature}°C`);
      if (parsed.respiratoryRate) summaryParts.push(`RR: ${parsed.respiratoryRate}/min`);
      if (parsed.glucose) summaryParts.push(`Sugar: ${parsed.glucose} mg/dL`);

      setLastParsedSummary(summaryParts.join(' • '));
    }
  };

  const startContinuousListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognitionRef.current = recognition;
      accumulatedTranscriptRef.current = '';

      setIsListening(true);
      setTranscript('Recording continuous voice dictation... (Speak all vitals, then tap "Stop & Auto-Fill")');

      recognition.onresult = (event: any) => {
        let currentString = '';
        for (let i = 0; i < event.results.length; i++) {
          currentString += event.results[i][0].transcript + ' ';
        }
        accumulatedTranscriptRef.current = currentString.trim();
        setTranscript(currentString.trim());
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListeningAndProcess = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);

    // Process the entire accumulated transcript on Stop Mic!
    const finalSpeech = accumulatedTranscriptRef.current || transcript;
    processAndCommitTranscript(finalSpeech);
  };

  const handleSimulateVoice = (phraseText: string) => {
    setTranscript(`"${phraseText}"`);
    processAndCommitTranscript(phraseText);
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-blue-950/90 border border-cyan-500/40 shadow-xl text-white space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              Voice AI Clinical Assistant
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Continuous Recording Mode
              </span>
            </h4>
            <p className="text-[11px] text-slate-300">
              Tap Mic ON → Speak all vitals continuously → Tap Stop & Auto-Fill
            </p>
          </div>
        </div>

        {/* MIC TOGGLE BUTTON */}
        <button
          type="button"
          onClick={isListening ? stopListeningAndProcess : startContinuousListening}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-lg transition-all ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" /> Stop Mic & Auto-Fill Columns
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 animate-bounce" /> Tap Mic ON to Record
            </>
          )}
        </button>
      </div>

      {/* LIVE TRANSCRIPT DISPLAY & SUMMARY CONFIRMATION */}
      {(transcript || lastParsedSummary) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-1.5"
        >
          {transcript && (
            <div className="flex items-start gap-2 text-xs">
              <Volume2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-200 italic font-medium">"{transcript}"</span>
            </div>
          )}

          {lastParsedSummary && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Extracted & Populated into Form Columns below: {lastParsedSummary}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* DEMO VOICE PRESETS */}
      <div className="flex items-center gap-2 flex-wrap text-[10px] pt-1">
        <span className="font-bold text-slate-400 uppercase">Test Voice Presets:</span>
        <button
          type="button"
          onClick={() => handleSimulateVoice("heart rate 95 oxygen saturation 97 systolic 120 diastolic 80 body temperature 37 respiration rate 16 sugar 140")}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-semibold transition-all"
        >
          "HR 95 Oxygen 97 Systolic 120 Diastolic 80 Temp 37 RR 16 Sugar 140"
        </button>
        <button
          type="button"
          onClick={() => handleSimulateVoice("heart rate 135 systolic 165 diastolic 98 oxygen saturation 88 body temperature 38.5 respiration rate 26")}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 font-semibold transition-all"
        >
          "HR 135 Systolic 165 Diastolic 98 Oxygen 88 Temp 38.5 RR 26"
        </button>
      </div>
    </div>
  );
};
