import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setStatus, appendEntry } from "@/redux/slices/transcriptSlice";
import {
  Room,
  RoomEvent,
  LocalAudioTrack,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  createLocalAudioTrack, // Corrected: Imported standalone function
} from "livekit-client";

export default function VoiceRecorder() {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector((s) => s.session.sessionId);

  const [recording, setRecording] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected" | "reconnecting"
  >("idle");

  const roomRef = useRef<Room | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupLiveKit();
    };
  }, []);

  const cleanupLiveKit = async () => {
    try {
      if (localAudioTrackRef.current) {
        // Unpublish track if room is still connected
        if (roomRef.current?.state === "connected") {
          await roomRef.current.localParticipant.unpublishTrack(localAudioTrackRef.current);
        }
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current = null;
      }

      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    } finally {
      setConnectionStatus("idle");
      setRecording(false);
      dispatch(setStatus("idle"));
    }
  };

  const start = async () => {
    if (!sessionId) {
      toast.error("Session not initialized");
      return;
    }

    try {
      setConnecting(true);
      setConnectionStatus("connecting");
      dispatch(setStatus("processing"));

      // 1. Fetch LiveKit token from backend
      const tokenResponse = await fetch(`http://localhost:5000/api/v1/livekit/token/${sessionId}`);
      if (!tokenResponse.ok) {
        throw new Error("Failed to retrieve LiveKit token from server");
      }

      const { data } = await tokenResponse.json();
      const { token, url } = data;

      // 2. Initialize LiveKit Room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // 3. Set up lifecycle event listeners
      room.on(RoomEvent.Connected, () => {
        setConnectionStatus("connected");
        dispatch(setStatus("listening"));
        setRecording(true);
        setConnecting(false);
        toast.success("Connected to LiveKit session");
      });

      room.on(RoomEvent.Reconnecting, () => {
        setConnectionStatus("reconnecting");
        dispatch(setStatus("processing"));
        toast.loading("Reconnecting to audio stream...", { id: "lk-reconnect" });
      });

      room.on(RoomEvent.Reconnected, () => {
        setConnectionStatus("connected");
        dispatch(setStatus("listening"));
        toast.dismiss("lk-reconnect");
        toast.success("Reconnected successfully");
      });

      room.on(RoomEvent.Disconnected, () => {
        toast.dismiss("lk-reconnect");
        if (recording) {
          toast.error("LiveKit connection lost");
        }
        cleanupLiveKit();
      });

      // 4. Handle Incoming AI Audio Tracks (Gemini Voice Playback)
      room.on(
        RoomEvent.TrackSubscribed,
        (track: RemoteTrack, publication: RemoteTrackPublication) => {
          if (track.kind === Track.Kind.Audio) {
            // Attach the remote audio track dynamically to the DOM for audio playback
            const audioElement = track.attach();
            document.body.appendChild(audioElement);

            // Corrected: Manage unsubscriptions dynamically via the room instance
            room.on(RoomEvent.TrackUnsubscribed, (unsubscribedTrack) => {
              if (unsubscribedTrack.sid === track.sid) {
                track.detach(audioElement);
                audioElement.remove();
              }
            });
          }
        },
      );

      // 5. Handle Text Data Messages (Gemini Live Real-time Transcripts)
      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant) => {
        try {
          const textDecoder = new TextDecoder();
          const messageString = textDecoder.decode(payload);
          const data = JSON.parse(messageString);

          if (data && data.text) {
            dispatch(
              appendEntry({
                role: data.role || "model",
                text: data.text.trim(),
                timestamp: new Date().toISOString(),
              }),
            );
          }
        } catch (e) {
          console.error("Failed to parse data message from stream:", e);
        }
      });

      // 6. Connect to LiveKit Server
      await room.connect(url, token);

      // 7. Corrected: Request Mic Access using standalone createLocalAudioTrack
      const localAudioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      localAudioTrackRef.current = localAudioTrack;

      await room.localParticipant.publishTrack(localAudioTrack, {
        name: "microphone",
      });
    } catch (error) {
      setConnecting(false);
      cleanupLiveKit();
      const message =
        error instanceof Error ? error.message : "Microphone or connection access denied";
      toast.error(message);
      console.error("LiveKit Stream Start Error:", error);
    }
  };

  const stop = async () => {
    await cleanupLiveKit();
    toast.success("Disconnected streaming");
  };

  const getStatusText = () => {
    if (connecting) return "Connecting to stream...";
    if (connectionStatus === "reconnecting") return "Signal weak, reconnecting...";
    if (recording) return "Gemini is listening... Tap to stop";
    return "Tap to talk to Gemini";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={recording ? stop : start}
        disabled={connecting || connectionStatus === "reconnecting"}
        className={`inline-flex h-16 w-16 items-center justify-center rounded-full transition ${
          recording
            ? "bg-red-500 text-white animate-pulse"
            : "bg-primary text-primary-foreground hover:opacity-90"
        } disabled:opacity-40`}
        aria-label={recording ? "Stop stream" : "Start stream"}
      >
        {connecting ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : recording ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>
      <p className="text-xs text-muted-foreground select-none">{getStatusText()}</p>
    </div>
  );
}
