import React, { useState } from 'react';
import { QrCode, Scan, CheckCircle2, X, Printer, Sparkles, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Patient } from '../../types';
import { useApp } from '../../context/AppContext';

interface QRCodePatientIdProps {
  patient: Patient;
  size?: number;
}

export const QRCodePatientId: React.FC<QRCodePatientIdProps> = ({ patient, size = 120 }) => {
  const { navigateToPatientProfile } = useApp();
  const [showScanModal, setShowScanModal] = useState<boolean>(false);
  const [scannedSuccess, setScannedSuccess] = useState<boolean>(false);

  // Generate SVG QR Code Matrix Procedurally
  const generateQRSvg = (text: string) => {
    // Generate deterministic 21x21 QR-like matrix grid based on hash
    const matrixSize = 21;
    const cells = [];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Finder patterns (corners)
        const isTopLeftFinder = (r < 7 && c < 7) && !(r > 0 && r < 6 && c > 0 && c < 6 && (r === 1 || r === 5 || c === 1 || c === 5));
        const isTopRightFinder = (r < 7 && c >= 14) && !(r > 0 && r < 6 && c > 14 && c < 20 && (r === 1 || r === 5 || c === 15 || c === 19));
        const isBottomLeftFinder = (r >= 14 && c < 7) && !(r > 14 && r < 20 && c > 0 && c < 6 && (r === 15 || r === 19 || c === 1 || c === 5));

        const isFinderOuter = (r < 7 && c < 7) || (r < 7 && c >= 14) || (r >= 14 && c < 7);
        let filled = false;

        if (isFinderOuter) {
          filled = isTopLeftFinder || isTopRightFinder || isBottomLeftFinder;
        } else {
          // Pseudorandom data cells based on text hash
          filled = Math.abs((r * 31 + c * 17 + hash) % 3) === 0;
        }

        if (filled) {
          cells.push(
            <rect
              key={`${r}-${c}`}
              x={c * 10}
              y={r * 10}
              width="9.5"
              height="9.5"
              rx="1.5"
              fill="#0f172a"
            />
          );
        }
      }
    }

    return (
      <svg viewBox="0 0 210 210" className="w-full h-full bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        {cells}
      </svg>
    );
  };

  const handleSimulateScan = () => {
    setScannedSuccess(true);
    setTimeout(() => {
      setScannedSuccess(false);
      setShowScanModal(false);
      navigateToPatientProfile(patient.id);
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {/* QR CODE CONTAINER */}
      <div
        onClick={() => setShowScanModal(true)}
        className="group relative cursor-pointer p-2 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        {generateQRSvg(patient.id + '-' + patient.bed)}

        <div className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
          <Scan className="w-6 h-6 text-cyan-400 animate-pulse" />
          <span className="text-[9px] font-extrabold uppercase mt-1">Scan Wristband</span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-[10px] font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
          {patient.id} • {patient.bed}
        </span>
      </div>

      {/* SCANNER MODAL */}
      <AnimatePresence>
        {showScanModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Scan className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h3 className="text-base font-black tracking-tight text-white">
                    Patient QR Wristband Scanner
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScanModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SCANNER VIEWPORT */}
              <div className="relative h-64 rounded-2xl bg-slate-950 border border-cyan-500/30 overflow-hidden flex items-center justify-center">
                {/* SCANNER GRID OVERLAY */}
                <div className="absolute inset-4 border-2 border-cyan-400/60 rounded-xl pointer-events-none z-10 flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-t-2 border-l-2 border-cyan-400" />
                    <div className="w-5 h-5 border-t-2 border-r-2 border-cyan-400" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-b-2 border-l-2 border-cyan-400" />
                    <div className="w-5 h-5 border-b-2 border-r-2 border-cyan-400" />
                  </div>
                </div>

                {/* SCANNING ANIMATION LINE */}
                <motion.div
                  animate={{ y: [-95, 95, -95] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="absolute inset-x-0 z-20 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_14px_#38bdf8]"
                />

                {/* QR INSIDE VIEWPORT - PERFECTLY CENTERED */}
                <div className="relative z-0 w-36 h-36 flex items-center justify-center">
                  {generateQRSvg(patient.id + '-' + patient.bed)}
                </div>

                {scannedSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center text-emerald-300 space-y-2"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                    <span className="text-sm font-black uppercase tracking-wider">Wristband Verified!</span>
                    <span className="text-xs text-emerald-200">{patient.name} ({patient.bed})</span>
                  </motion.div>
                )}
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Patient:</span>
                    <span className="font-bold text-white">{patient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Patient ID:</span>
                    <span className="font-mono font-bold text-cyan-400">{patient.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bed Location:</span>
                    <span className="font-bold text-emerald-400">{patient.bed} ({patient.ward})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateScan}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg transition-all"
                  >
                    Simulate Bedside Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    title="Print Wristband Tag"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
