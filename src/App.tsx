import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const muteRef = useRef<GainNode | null>(null); // silent monitor

  useEffect(() => {
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      setStatus("Open this page over HTTPS to enable the microphone.");
    } else {
      setStatus("");
    }
    return () => { void stopMic(); };

  }, []);

  const startMic = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const AC: typeof AudioContext =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume();

    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;

    await ctx.audioWorklet.addModule("/worklets/processor.js");
    const node = new AudioWorkletNode(ctx, "processor");
    workletRef.current = node;

    const mute = ctx.createGain();
    mute.gain.value = 0;
    muteRef.current = mute;

    source.connect(node).connect(mute).connect(ctx.destination);
  };

  const stopMic = async () => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      workletRef.current?.disconnect();
      sourceRef.current?.disconnect();
      muteRef.current?.disconnect();
      await ctxRef.current?.close?.();
    } finally {
      streamRef.current = null;
      workletRef.current = null;
      sourceRef.current = null;
      muteRef.current = null;
      ctxRef.current = null;
    }
  };

  const start = async () => {
    try {
      await startMic();
      setIsRecording(true);
      setStatus("You're microphone is on. You are now recording!");
      setTimeout(() => iframeRef.current?.contentWindow?.focus(), 0);
    } catch (e: any) {
      console.error(e);
      setStatus("Microphone access failed. " + (e?.message ?? ""));
      await stopMic();
      setIsRecording(false);
    }
  };

  const stop = async () => {
    await stopMic();
    setIsRecording(false);
    setStatus("");
  };

  return (
    <main className="stage">
      <h1 className="title">Welcome to the Interview Test Web Page</h1>

      <div className={`viz-frame ${isRecording ? "recording" : "idle"}`}>
        <div className="viz-inner">
          {!isRecording ? (
            <div className="black-fill" />
          ) : (
            <>
              
              {/* overlay text on top */}
              <div className="viz-text" aria-hidden="true">
                [Visualization Goes<br />Here]
              </div>
            </>
          )}
        </div>
      </div>


      {isRecording && <p className="status">{status}</p>}

      <div className="actions">
        {!isRecording ? (
          <button className="btn cta-start" onClick={start}>
            CLICK HERE TO START RECORDING!
          </button>
        ) : (
          <button className="btn cta-stop" onClick={stop}>
            CLICK HERE TO STOP RECORDING.
          </button>
        )}
      </div>
    </main>
  );
}
