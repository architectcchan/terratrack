"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Trash2, X, Search } from "lucide-react";
import { addDays, addWeeks, addMonths, format } from "date-fns";
import type { ProductOption } from "./visit-log-types";
import { cn } from "@/lib/utils";

interface StepNotesProps {
  notes: string;
  voiceNoteDuration: number | null;
  voiceNoteBlob: Blob | null;
  productsDiscussed: ProductOption[];
  followUpDate: string | null;
  followUpNote: string;
  allProducts: ProductOption[];
  onUpdateNotes: (notes: string) => void;
  onUpdateVoiceNote: (duration: number | null, blob: Blob | null) => void;
  onUpdateProductsDiscussed: (products: ProductOption[]) => void;
  onUpdateFollowUp: (date: string | null, note: string) => void;
  onNext: () => void;
}

export function StepNotes({
  notes,
  voiceNoteDuration,
  voiceNoteBlob,
  productsDiscussed,
  followUpDate,
  followUpNote,
  allProducts,
  onUpdateNotes,
  onUpdateVoiceNote,
  onUpdateProductsDiscussed,
  onUpdateFollowUp,
  onNext,
}: StepNotesProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onUpdateVoiceNote(recordingTime, blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(
        () => setRecordingTime((t) => t + 1),
        1000
      );
    } catch {
      // microphone not available
    }
  }, [onUpdateVoiceNote, recordingTime]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
  }, []);

  const playVoiceNote = useCallback(() => {
    if (!voiceNoteBlob) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }
    const url = URL.createObjectURL(voiceNoteBlob);
    const audio = new Audio(url);
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
      URL.revokeObjectURL(url);
    };
    audio.play();
    audioRef.current = audio;
    setIsPlaying(true);
  }, [voiceNoteBlob]);

  const deleteVoiceNote = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onUpdateVoiceNote(null, null);
    setIsPlaying(false);
    setRecordingTime(0);
  }, [onUpdateVoiceNote]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const today = useMemo(() => new Date(), []);
  const quickDates = useMemo(
    () => [
      { label: "Tomorrow", date: format(addDays(today, 1), "yyyy-MM-dd") },
      { label: "3 Days", date: format(addDays(today, 3), "yyyy-MM-dd") },
      { label: "1 Week", date: format(addWeeks(today, 1), "yyyy-MM-dd") },
      { label: "2 Weeks", date: format(addWeeks(today, 2), "yyyy-MM-dd") },
      { label: "1 Month", date: format(addMonths(today, 1), "yyyy-MM-dd") },
    ],
    [today]
  );

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    const selectedIds = new Set(productsDiscussed.map((p) => p.id));
    return allProducts
      .filter(
        (p) =>
          !selectedIds.has(p.id) &&
          (p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.strainName && p.strainName.toLowerCase().includes(q)))
      )
      .slice(0, 8);
  }, [allProducts, productSearch, productsDiscussed]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder="What happened during this visit? Any important details..."
            className="min-h-[120px] text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Voice Note
          </label>
          {!voiceNoteDuration && !isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D4A843] hover:bg-[#D4A843]/90 text-white font-medium text-sm transition-colors active:scale-[0.98]"
            >
              <Mic className="h-5 w-5" />
              Record Voice Note
            </button>
          ) : isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors animate-pulse"
            >
              <Square className="h-4 w-4 fill-white" />
              Stop Recording ({formatTime(recordingTime)})
            </button>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
              <Mic className="h-4 w-4 text-[#D4A843]" />
              <span className="text-sm text-gray-700 flex-1">
                Voice note recorded ({formatTime(voiceNoteDuration ?? 0)})
              </span>
              <button
                type="button"
                onClick={playVoiceNote}
                className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Play
                  className={cn(
                    "h-4 w-4",
                    isPlaying ? "text-[#1B4332]" : "text-gray-500"
                  )}
                />
              </button>
              <button
                type="button"
                onClick={deleteVoiceNote}
                className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Products Discussed{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-8 h-9 text-sm"
            />
          </div>
          {filteredProducts.length > 0 && (
            <div className="mt-1 bg-white rounded-lg border border-gray-200 max-h-[120px] overflow-y-auto">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onUpdateProductsDiscussed([...productsDiscussed, p]);
                    setProductSearch("");
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-400 ml-2 text-xs">
                    {p.unitSize}
                  </span>
                </button>
              ))}
            </div>
          )}
          {productsDiscussed.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {productsDiscussed.map((p) => (
                <Badge key={p.id} variant="secondary" className="text-xs pr-1 gap-1">
                  {p.name}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateProductsDiscussed(
                        productsDiscussed.filter((x) => x.id !== p.id)
                      )
                    }
                    className="ml-0.5 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Follow-up Date
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {quickDates.map((qd) => (
              <button
                key={qd.label}
                type="button"
                onClick={() =>
                  onUpdateFollowUp(
                    followUpDate === qd.date ? null : qd.date,
                    followUpNote
                  )
                }
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors",
                  followUpDate === qd.date
                    ? "bg-[#1B4332] text-white border-[#1B4332]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {qd.label}
              </button>
            ))}
          </div>
          <Input
            type="date"
            value={followUpDate ?? ""}
            onChange={(e) =>
              onUpdateFollowUp(e.target.value || null, followUpNote)
            }
            className="h-9 text-sm"
            min={format(today, "yyyy-MM-dd")}
          />
          {followUpDate && (
            <Input
              value={followUpNote}
              onChange={(e) => onUpdateFollowUp(followUpDate, e.target.value)}
              placeholder="Follow-up note..."
              className="h-9 text-sm mt-2"
            />
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <Button
          onClick={onNext}
          className="w-full h-11 bg-[#1B4332] hover:bg-[#1B4332]/90 text-sm font-medium"
        >
          Review & Submit
        </Button>
      </div>
    </div>
  );
}
