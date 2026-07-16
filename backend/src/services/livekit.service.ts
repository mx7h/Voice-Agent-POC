import { AccessToken } from "livekit-server-sdk";

export class LiveKitService {
  async createToken(sessionId: string) {
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: sessionId,
      }
    );

    token.addGrant({
      roomJoin: true,
      room: sessionId,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    return {
      token: await token.toJwt(),
      url: process.env.LIVEKIT_URL,
      room: sessionId,
    };
  }
}

export const liveKitService = new LiveKitService();