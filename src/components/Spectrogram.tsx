import React, { useEffect, useRef } from "react";

type Props = { onError?: (msg: string) => void };


//Custom Spectrogram component
export default function Spectrogram({ onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<any>(null);      
  const analyserRef = useRef<any>(null);       
  const streamRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const paletteRef = useRef<Uint8ClampedArray | null>(null);

  const buildPalette = () => {
    const p = new Uint8ClampedArray(256 * 4);
    for (let i = 0; i < 256; i++) {
      const hue = 280 - (i / 255) * 280;
      const sat = 100, light = Math.min(50 + (i / 255) * 35, 95);
      const [r, g, b] = hslToRgb(hue / 360, sat / 100, light / 100);
      const o = i * 4;
      p[o] = r; p[o + 1] = g; p[o + 2] = b; p[o + 3] = 255;
    }
    return p;
  };

  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const tc = (t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    return [Math.round(tc(h + 1/3) * 255), Math.round(tc(h) * 255), Math.round(tc(h - 1/3) * 255)];
  };

  const sizeToBox = () => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    c.width = Math.max(100, Math.floor(rect.width));
    c.height = Math.max(100, Math.floor(rect.height));
  };

  useEffect(() => {
    let cancelled = false;
    paletteRef.current = buildPalette();
    sizeToBox();

    const RO: any = (window as any).ResizeObserver;
    const ro: any = RO ? new RO(sizeToBox) : null;
    if (ro && canvasRef.current) ro.observe(canvasRef.current);

    (async () => {
      try {
        const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AC();

        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) return;

        const source = audioCtxRef.current.createMediaStreamSource(streamRef.current);
        const analyser = audioCtxRef.current.createAnalyser();
        analyser.fftSize = 1024;
        analyser.minDecibels = -100;
        analyser.maxDecibels = -30;
        analyser.smoothingTimeConstant = 0.0;
        source.connect(analyser);
        analyserRef.current = analyser;

        draw();
      } catch (e: any) {
        onError?.("Microphone access failed. " + (e?.message ?? ""));
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t: any) => t.stop());
      if (analyserRef.current) analyserRef.current.disconnect();
      if (ro) ro.disconnect();
    };
  }, []);

  const draw = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const analyser = analyserRef.current!;
    const palette = paletteRef.current!;

    const freqCount = analyser.frequencyBinCount;
    const data = new Uint8Array(freqCount);

    // shift left by 1px
    ctx.drawImage(canvas, 1, 0, canvas.width - 1, canvas.height, 0, 0, canvas.width - 1, canvas.height);

    analyser.getByteFrequencyData(data);
    const col = ctx.createImageData(1, canvas.height);

    for (let y = 0; y < canvas.height; y++) {
      const t = 1 - y / (canvas.height - 1 || 1);
      const idx = Math.min(freqCount - 1, Math.max(0, Math.floor(t * freqCount)));
      const v = data[idx];
      const o = y * 4, po = v * 4;
      col.data[o]     = palette[po];
      col.data[o + 1] = palette[po + 1];
      col.data[o + 2] = palette[po + 2];
      col.data[o + 3] = 255;
    }
    ctx.putImageData(col, canvas.width - 1, 0);
    rafRef.current = requestAnimationFrame(draw);
  };

  return <canvas ref={canvasRef} className="specCanvas" aria-label="Live spectrogram" />;
}
