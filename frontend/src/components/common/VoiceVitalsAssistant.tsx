import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, CheckCircle2, Volume2, AlertCircle, Play } from 'lucide-react';
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
  const [manualInput, setManualInput] = useState<string>('');
  const [lastParsedSummary, setLastParsedSummary] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMessage('Web Speech API is not supported in this browser. You can use the dictation box below.');
    }
  }, []);

  // Comprehensive Medical Speech NLP Extractor
  const parseFullVoiceTranscript = (fullText: string): ParsedVitals => {
    if (!fullText) return {};

    // Pre-normalize text for spoken phrases (e.g., "point", "over", "by")
    const lower = fullText
      .toLowerCase()
      .replace(/\bpoint\b/g, '.')
      .replace(/\bdot\b/g, '.')
      .replace(/\bover\b/g, '/')
      .replace(/\bby\b/g, '/')
      .replace(/\bpercent\b/g, '%');

    const result: ParsedVitals = {};

    // 1. Joint BP: "BP 120 80", "120 over 80", "120/80", "blood pressure 120/80"
    const bpJointMatch =
      lower.match(/(?:bp|blood pressure)\s*(\d{2,3})[\s\/\-_]+(\d{2,3})/) ||
      lower.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);

    if (bpJointMatch) {
      const sys = parseInt(bpJointMatch[1], 10);
      const dia = parseInt(bpJointMatch[2], 10);
      if (sys >= 60 && sys <= 260) result.systolic = sys;
      if (dia >= 30 && dia <= 160) result.diastolic = dia;
    }

    // Individual Systolic BP: "systolic BP 120", "systolic 120", "sys 120"
    const sysMatch = lower.match(/(?:systolic\s*bp|systolic|sys)\s*(\d{2,3})/);
    if (sysMatch && !result.systolic) {
      const sys = parseInt(sysMatch[1], 10);
      if (sys >= 60 && sys <= 260) result.systolic = sys;
    }

    // Individual Diastolic BP: "diastolic BP 80", "diastolic 80", "dia 80"
    const diaMatch = lower.match(/(?:diastolic\s*bp|diastolic|dia)\s*(\d{2,3})/);
    if (diaMatch && !result.diastolic) {
      const dia = parseInt(diaMatch[1], 10);
      if (dia >= 30 && dia <= 160) result.diastolic = dia;
    }

    // 2. Heart Rate / Pulse / BPM: "heart rate 95", "pulse 95", "hr 95", "95 bpm", "bpm 95"
    const hrMatch =
      lower.match(/(?:heart\s*rate|pulse|hr|heartrate)\s*(\d{2,3})/) ||
      lower.match(/(\d{2,3})\s*bpm/) ||
      lower.match(/bpm\s*(\d{2,3})/);

    if (hrMatch) {
      const hr = parseInt(hrMatch[1], 10);
      if (hr >= 30 && hr <= 220) result.heartRate = hr;
    }

    // 3. SpO2 / Oxygen Saturation: "oxygen saturation 97", "spo2 97", "oxygen 97", "sat 97"
    const spo2Match = lower.match(/(?:spo2|sp o2|oxygen\s*saturation|oxygen|o2|sat)\s*(\d{2,3})/);
    if (spo2Match) {
      const spo2 = parseInt(spo2Match[1], 10);
      if (spo2 >= 50 && spo2 <= 100) result.spo2 = spo2;
    }

    // 4. Glucose / Sugar: "sugar 140", "glucose 140", "blood sugar 140"
    const glucoseMatch = lower.match(/(?:sugar|glucose|blood sugar)\s*(\d{2,3})/);
    if (glucoseMatch) {
      const glu = parseInt(glucoseMatch[1], 10);
      if (glu >= 20 && glu <= 600) result.glucose = glu;
    }

    // 5. Body Temperature: "body temperature 37.5", "temperature 37", "temp 37.2"
    const tempMatch = lower.match(/(?:body\s*temperature|temperature|temp|fever)\s*(\d{2}(?:\.\d)?)/);
    if (tempMatch) {
      const temp = parseFloat(tempMatch[1]);
      if (temp >= 30 && temp <= 45) result.temperature = temp;
    }

    // 6. Respiratory Rate: "respiration rate 16", "respiratory rate 16", "respiration 16", "rr 16", "breathing 16"
    const rrMatch = lower.match(/(?:respiration\s*rate|respiratory\s*rate|respiration|breathing|rr)\s*(\d{1,2})/);
    if (rrMatch) {
      const rr = parseInt(rrMatch[1], 10);
      if (rr >= 4 && rr <= 60) result.respiratoryRate = rr;
    }

    // 7. Urine Output: "urine output 35", "urine 35", "urine output 40 ml", "output 35"
    const urineMatch = lower.match(/(?:urine\s*output|urine|urine\s*flow|output)\s*(\d{1,3})/);
    if (urineMatch) {
      const urine = parseInt(urineMatch[1], 10);
      if (urine >= 0 && urine <= 1000) result.urineOutput = urine;
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
      if (parsed.urineOutput) summaryParts.push(`Urine: ${parsed.urineOutput} mL`);

      setLastParsedSummary(summaryParts.join(' • '));
    }
  };

  const startContinuousListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMessage('Web Speech API is not supported in this browser. Please use Google Chrome, Edge, or type in the dictation box below.');
      return;
    }

    setErrorMessage('');
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognitionRef.current = recognition;
      accumulatedTranscriptRef.current = '';

      setIsListening(true);
      setTranscript('');

      recognition.onresult = (event: any) => {
        let currentString = '';
        for (let i = 0; i < event.results.length; i++) {
          currentString += event.results[i][0].transcript + ' ';
        }
        const clean = currentString.trim();
        accumulatedTranscriptRef.current = clean;
        setTranscript(clean);

        // Instant live parsing while speaking!
        const liveParsed = parseFullVoiceTranscript(clean);
        if (Object.keys(liveParsed).length > 0) {
          onVitalsParsed(liveParsed, clean);
          
          const summaryParts = [];
          if (liveParsed.heartRate) summaryParts.push(`HR: ${liveParsed.heartRate} bpm`);
          if (liveParsed.spo2) summaryParts.push(`SpO₂: ${liveParsed.spo2}%`);
          if (liveParsed.systolic || liveParsed.diastolic) summaryParts.push(`BP: ${liveParsed.systolic || '—'}/${liveParsed.diastolic || '—'}`);
          if (liveParsed.temperature) summaryParts.push(`Temp: ${liveParsed.temperature}°C`);
          if (liveParsed.respiratoryRate) summaryParts.push(`RR: ${liveParsed.respiratoryRate}/min`);
          if (liveParsed.glucose) summaryParts.push(`Sugar: ${liveParsed.glucose} mg/dL`);
          if (liveParsed.urineOutput) summaryParts.push(`Urine: ${liveParsed.urineOutput} mL`);

          setLastParsedSummary(summaryParts.join(' • '));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Microphone access denied. Please click the camera/lock icon in your browser URL bar to allow microphone access.');
          setIsListening(false);
        } else if (event.error === 'audio-capture') {
          setErrorMessage('No microphone detected. Please connect a microphone and try again.');
          setIsListening(false);
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Always commit accumulated transcript when recording finishes!
        if (accumulatedTranscriptRef.current) {
          processAndCommitTranscript(accumulatedTranscriptRef.current);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage('Could not start microphone: ' + (err.message || 'Unknown error'));
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

    const finalSpeech = accumulatedTranscriptRef.current || transcript;
    processAndCommitTranscript(finalSpeech);
  };

  const handleSimulateVoice = (phraseText: string) => {
    setTranscript(`"${phraseText}"`);
    processAndCommitTranscript(phraseText);
  };

  const handleManualProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setTranscript(`"${manualInput.trim()}"`);
    processAndCommitTranscript(manualInput.trim());
    setManualInput('');
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
              Tap Mic ON → Speak all vitals continuously → Values auto-fill in real time
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
              <MicOff className="w-4 h-4" /> Stop Mic & Auto-Fill
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 animate-bounce" /> Tap Mic ON to Record
            </>
          )}
        </button>
      </div>

      {/* ERROR MESSAGE BANNER */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs font-bold text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

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

      {/* MANUAL VOICE DICTATION TEXT FALLBACK */}
      <form onSubmit={handleManualProcess} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Or type/paste dictation (e.g. 'heart rate 95 spo2 98 bp 120/80 temp 37.2')..."
          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          disabled={!manualInput.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-xs font-extrabold text-white transition-all shrink-0"
        >
          <Play className="w-3.5 h-3.5" />
          Auto-Fill
        </button>
      </form>

      {/* DEMO VOICE PRESETS */}
      <div className="flex items-center gap-2 flex-wrap text-[10px] pt-1 border-t border-slate-800/60">
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
