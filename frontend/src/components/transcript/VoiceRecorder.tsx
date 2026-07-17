import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useCartPolling } from "@/hooks/useCartPolling";
import toast from "react-hot-toast";

import { useAppDispatch } from "@/redux/hooks";

import { createSession, clearSession, setSessionId } from "@/redux/slices/sessionSlice";

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

const LIVEKIT_TOKEN_URL = "http://localhost:5000/api/v1/livekit/token";

const SESSION_URL = "http://localhost:5000/api/v1/sessions";

export default function VoiceRecorder() {
  const dispatch = useAppDispatch();
  const [recording, setRecording] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useCartPolling(recording);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");

  const roomRef = useRef<Room | null>(null);

  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);

  const recordingRef = useRef(false);

  const isCleaningUpRef = useRef(false);

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

  const cleanupLiveKit = async () => {
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
      resetState();

      dispatch(clearSession());
      dispatch(setCart(null));
      dispatch(clearTranscript());

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

      dispatch(
        appendEntry({
          role,
          text: transcriptText,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      console.warn("Received an invalid LiveKit data message:", error);
    }
  };

  const start = async () => {
    if (connecting) {
      return;
    }

    try {
      await cleanupLiveKit();

      setConnecting(true);
      setConnectionStatus("connecting");

      dispatch(setStatus("processing"));

      const newSessionId = await createNewSession();

      dispatch(setSessionId(newSessionId));

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
        toast.dismiss("livekit-reconnect");

        const wasRecording = recordingRef.current;

        recordingRef.current = false;

        localAudioTrackRef.current?.stop();
        localAudioTrackRef.current = null;

        removeRemoteAudioElements();

        roomRef.current = null;

        resetState();

        dispatch(clearSession());
        dispatch(setCart(null));
        dispatch(clearTranscript());

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

      await cleanupLiveKit();

      const message =
        error instanceof Error ? error.message : "Microphone or connection access denied";

      toast.error(message);
    }
  };

  const stop = async () => {
    await cleanupLiveKit();

    toast.success("Voice session ended");
  };

  useEffect(() => {
    return () => {
      void cleanupLiveKit();
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
