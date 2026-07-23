import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff } from "lucide-react";
import toast from "react-hot-toast";

import { useCartPolling } from "@/hooks/useCartPolling";
import { analyticsApi } from "@/api/analytics.api";

import { useAppDispatch } from "@/redux/hooks";
import {
  clearSession,
  setSessionCreating,
  setSessionError,
  setSessionId,
} from "@/redux/slices/sessionSlice";
import { setCart } from "@/redux/slices/cartSlice";
import { appendEntry, clearTranscript, setStatus } from "@/redux/slices/transcriptSlice";

import {
  createLocalAudioTrack,
  LocalAudioTrack,
  RemoteTrack,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";

type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting";

type TranscriptMessage = {
  role?: "user" | "assistant" | "model";
  text?: string;
};

type AnalyticsEndStatus = "completed" | "failed";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const LIVEKIT_TOKEN_URL = `${API_BASE_URL}/livekit/token`;
const SESSION_URL = `${API_BASE_URL}/sessions`;

export default function VoiceRecorder() {
  const dispatch = useAppDispatch();

  const [recording, setRecording] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useCartPolling(recording, activeSessionId);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");

  const roomRef = useRef<Room | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);

  const transcriptSegmentIdsRef = useRef<Set<string>>(new Set());

  const recordingRef = useRef(false);
  const isCleaningUpRef = useRef(false);

  const sessionIdRef = useRef<string | null>(null);
  const analyticsEndedRef = useRef(false);

  const audioElementsRef = useRef<Map<string, HTMLMediaElement>>(new Map());

  const createNewSession = async () => {
    const response = await fetch(SESSION_URL, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to create session");
    }

    const body = await response.json();

    const newSessionId = body.data?.sessionId ?? body.sessionId ?? body.data?._id;

    if (!newSessionId) {
      throw new Error("Session response missing sessionId");
    }

    return String(newSessionId);
  };

  const endAnalyticsOnce = async (status: AnalyticsEndStatus = "completed") => {
    const currentSessionId = sessionIdRef.current;

    if (!currentSessionId || analyticsEndedRef.current) {
      return;
    }

    analyticsEndedRef.current = true;

    try {
      await analyticsApi.end(currentSessionId, status);
    } catch (error) {
      console.warn("[ANALYTICS END ERROR]", error);
    }
  };

  const recordAnalyticsTurn = (role: "user" | "assistant", text: string) => {
    const currentSessionId = sessionIdRef.current;
    const transcriptText = text.trim();

    if (!currentSessionId || !transcriptText) {
      return;
    }

    void analyticsApi.recordTurn(currentSessionId, role, transcriptText).catch((error) => {
      console.warn("[ANALYTICS TURN ERROR]", error);
    });
  };

  const appendTranscript = (role: "user" | "assistant", text: string) => {
    const transcriptText = text.trim();

    if (!transcriptText) {
      return;
    }

    dispatch(
      appendEntry({
        role,
        text: transcriptText,
        timestamp: new Date().toISOString(),
      }),
    );

    recordAnalyticsTurn(role, transcriptText);
  };

  const removeRemoteAudioElements = () => {
    for (const audioElement of audioElementsRef.current.values()) {
      audioElement.pause();
      audioElement.srcObject = null;
      audioElement.remove();
    }

    audioElementsRef.current.clear();
  };

  const resetState = () => {
    recordingRef.current = false;

    setRecording(false);
    setConnecting(false);
    setConnectionStatus("idle");

    dispatch(setStatus("idle"));
  };

  const cleanupLiveKit = async (analyticsStatus: AnalyticsEndStatus = "completed") => {
    if (isCleaningUpRef.current) {
      return;
    }

    isCleaningUpRef.current = true;

    const room = roomRef.current;
    const localAudioTrack = localAudioTrackRef.current;

    roomRef.current = null;
    localAudioTrackRef.current = null;

    try {
      if (localAudioTrack) {
        try {
          if (room?.state === "connected") {
            await room.localParticipant.unpublishTrack(localAudioTrack);
          }
        } catch (error) {
          console.warn("Unable to unpublish microphone:", error);
        }

        localAudioTrack.stop();
      }

      removeRemoteAudioElements();

      if (room) {
        room.removeAllListeners();

        if (room.state !== "disconnected") {
          await room.disconnect(true);
        }
      }
    } catch (error) {
      console.error("LiveKit cleanup error:", error);
    } finally {
      await endAnalyticsOnce(analyticsStatus);

      resetState();

      sessionIdRef.current = null;
      setActiveSessionId(null);

      transcriptSegmentIdsRef.current.clear();

      dispatch(clearSession());
      dispatch(setCart(null));

      isCleaningUpRef.current = false;
    }
  };

  const handleRemoteAudioTrack = (track: RemoteTrack) => {
    if (track.kind !== Track.Kind.Audio) {
      return;
    }

    const existingElement = audioElementsRef.current.get(track.sid as string);

    if (existingElement) {
      return;
    }

    const audioElement = track.attach();

    audioElement.autoplay = true;
    audioElement.controls = false;
    audioElement.setAttribute("playsinline", "true");

    document.body.appendChild(audioElement);

    audioElementsRef.current.set(track.sid as string, audioElement);

    void audioElement.play().catch((error) => {
      console.warn("Remote audio autoplay was blocked:", error);
    });
  };

  const handleRemoteAudioTrackRemoved = (track: RemoteTrack) => {
    const audioElement = audioElementsRef.current.get(track.sid as string);

    if (!audioElement) {
      return;
    }

    track.detach(audioElement);

    audioElement.pause();
    audioElement.srcObject = null;
    audioElement.remove();

    audioElementsRef.current.delete(track.sid as string);
  };

  const handleDataReceived = (payload: Uint8Array) => {
    try {
      const messageString = new TextDecoder().decode(payload);

      const data = JSON.parse(messageString) as TranscriptMessage;

      const transcriptText = data.text?.trim();

      if (!transcriptText) {
        return;
      }

      const role: "user" | "assistant" = data.role === "user" ? "user" : "assistant";

      appendTranscript(role, transcriptText);
    } catch (error) {
      console.warn("Received an invalid LiveKit data message:", error);
    }
  };

  const registerTranscriptHandler = (room: Room) => {
    const textRoom = room as Room & {
      registerTextStreamHandler?: (
        topic: string,
        handler: (reader: any, participantInfo: { identity: string }) => Promise<void>,
      ) => void;
    };

    if (!textRoom.registerTextStreamHandler) {
      console.warn(
        "[TRANSCRIPT] registerTextStreamHandler is not available. Update livekit-client.",
      );
      return;
    }

    textRoom.registerTextStreamHandler("lk.transcription", async (reader, participantInfo) => {
      try {
        const rawText = await reader.readAll();
        const text = String(rawText).trim();

        if (!text) {
          return;
        }

        const attributes = reader.info?.attributes ?? {};

        const isUser = participantInfo.identity === room.localParticipant.identity;

        const role: "user" | "assistant" = isUser ? "user" : "assistant";

        const isFinal = attributes["lk.transcription_final"] === "true";

        if (role === "user" && !isFinal) {
          return;
        }

        const segmentId =
          attributes["lk.segment_id"] ?? reader.info?.id ?? `${participantInfo.identity}-${text}`;

        const uniqueKey = `${role}-${segmentId}-${text}`;

        if (transcriptSegmentIdsRef.current.has(uniqueKey)) {
          return;
        }

        transcriptSegmentIdsRef.current.add(uniqueKey);

        console.log("[LIVEKIT TRANSCRIPT]", {
          role,
          text,
          isFinal,
          identity: participantInfo.identity,
          localIdentity: room.localParticipant.identity,
          attributes,
        });

        appendTranscript(role, text);
      } catch (error) {
        console.warn("[TRANSCRIPT ERROR]", error);
      }
    });
  };

  const start = async () => {
    if (connecting) {
      return;
    }

    try {
      await cleanupLiveKit();

      dispatch(clearTranscript());

      setConnecting(true);
      setConnectionStatus("connecting");
      dispatch(setStatus("processing"));
      dispatch(setSessionCreating());

      const newSessionId = await createNewSession();

      const currentSessionId = newSessionId;

      console.log("[VOICE SESSION CREATED]", newSessionId);

      sessionIdRef.current = newSessionId;
      setActiveSessionId(newSessionId);
      analyticsEndedRef.current = false;

      dispatch(setSessionId(newSessionId));
      console.log("[REDUX SESSION SET]", newSessionId);

      void analyticsApi.start(newSessionId).catch((error) => {
        console.warn("[ANALYTICS START ERROR]", error);
      });

      const tokenResponse = await fetch(`${LIVEKIT_TOKEN_URL}/${newSessionId}`);

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.json().catch(() => null);

        throw new Error(errorBody?.message ?? "Failed to retrieve the LiveKit token");
      }

      const responseBody = await tokenResponse.json();

      const token = responseBody.data?.token ?? responseBody.token;
      const url = responseBody.data?.url ?? responseBody.url;

      if (!token || !url) {
        throw new Error("LiveKit token response is incomplete");
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      registerTranscriptHandler(room);

      room.on(RoomEvent.Connected, () => {
        recordingRef.current = true;

        setRecording(true);
        setConnecting(false);
        setConnectionStatus("connected");

        dispatch(setStatus("listening"));

        toast.success("Connected to voice agent");
      });

      room.on(RoomEvent.Reconnecting, () => {
        setConnectionStatus("reconnecting");
        dispatch(setStatus("processing"));

        toast.loading("Reconnecting...", {
          id: "livekit-reconnect",
        });
      });

      room.on(RoomEvent.Reconnected, () => {
        recordingRef.current = true;

        setRecording(true);
        setConnecting(false);
        setConnectionStatus("connected");

        dispatch(setStatus("listening"));

        toast.dismiss("livekit-reconnect");
        toast.success("Reconnected");
      });

      room.on(RoomEvent.TrackSubscribed, (track) => {
        handleRemoteAudioTrack(track);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        handleRemoteAudioTrackRemoved(track);
      });

      room.on(RoomEvent.DataReceived, (payload) => {
        handleDataReceived(payload);
      });

      room.on(RoomEvent.Disconnected, () => {
        if (sessionIdRef.current !== currentSessionId) {
          return;
        }

        toast.dismiss("livekit-reconnect");

        const wasRecording = recordingRef.current;

        recordingRef.current = false;

        localAudioTrackRef.current?.stop();
        localAudioTrackRef.current = null;

        removeRemoteAudioElements();

        roomRef.current = null;

        void endAnalyticsOnce("completed");

        resetState();

        setActiveSessionId(null);
        sessionIdRef.current = null;

        dispatch(clearSession());
        dispatch(setCart(null));

        if (wasRecording && !isCleaningUpRef.current) {
          toast.error("Voice session disconnected");
        }
      });

      await room.connect(url, token);

      const microphoneTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      localAudioTrackRef.current = microphoneTrack;

      await room.localParticipant.publishTrack(microphoneTrack, {
        name: "microphone",
        source: Track.Source.Microphone,
      });
    } catch (error) {
      console.error("LiveKit stream start error:", error);

      await cleanupLiveKit("failed");

      dispatch(setSessionError(error instanceof Error ? error.message : "Session failed"));

      const message =
        error instanceof Error ? error.message : "Microphone or connection access denied";

      toast.error(message);
    }
  };

  const stop = async () => {
    await cleanupLiveKit("completed");

    toast.success("Voice session ended");
  };

  useEffect(() => {
    return () => {
      void cleanupLiveKit("completed");
    };
  }, []);

  const getStatusText = () => {
    if (connecting) {
      return "Connecting to voice agent...";
    }

    if (connectionStatus === "reconnecting") {
      return "Connection interrupted. Reconnecting...";
    }

    if (recording) {
      return "Voice agent is listening... Tap to stop";
    }

    return "Tap to talk to voice agent";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={connecting || connectionStatus === "reconnecting"}
        className={`inline-flex h-16 w-16 items-center justify-center rounded-full transition ${
          recording
            ? "animate-pulse bg-red-500 text-white"
            : "bg-primary text-primary-foreground hover:opacity-90"
        } disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label={recording ? "Stop voice session" : "Start voice session"}
      >
        {connecting ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : recording ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>

      <p className="select-none text-xs text-muted-foreground">{getStatusText()}</p>
    </div>
  );
}
