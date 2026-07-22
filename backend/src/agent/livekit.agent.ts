import "dotenv/config";

import { defineAgent, voice } from "@livekit/agents";
import * as openai from "@livekit/agents-plugin-openai";
import * as deepgram from "@livekit/agents-plugin-deepgram";

import { connectDB } from "../config/mongodb.js";
import { redisClient } from "../config/redis.js";

import { RESTAURANT_AGENT_INSTRUCTIONS } from "./prompts.js";
import { AgentFunctions } from "./functions.js";
import { createAgentTools } from "./tools.js";

import { analyticsService } from "../services/index.js";

export default defineAgent({
    entry: async (ctx) => {
        /**
         * LiveKit agent workers run separately from your Express server.
         * So MongoDB and Redis must be connected inside this worker too.
         */
        await connectDB();

        const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            throw new Error("GROQ_API_KEY is missing in .env");
        }

        if (!deepgramApiKey) {
            throw new Error(
                "DEEPGRAM_API_KEY is missing. Add it to backend/.env",
            );
        }

        if (!redisClient.isOpen) {
            await redisClient.connect();
        }

        console.log("Agent DB connections ready");

        /**
         * Join the LiveKit room.
         */
        await ctx.connect();

        console.log("Waiting for participant...");

        const participant = await ctx.waitForParticipant();

        console.log(`Participant joined: ${participant.identity}`);

        /**
         * Your LiveKit room name is the Redis session ID.
         */
        const sessionId = ctx.room.name;

        if (!sessionId) {
            throw new Error(
                "Session ID is missing from LiveKit room name",
            );
        }

        /**
         * Ensure analytics session exists.
         */
        try {
            await analyticsService.startSession(sessionId);
        } catch (error) {
            console.warn("[ANALYTICS START ERROR]", {
                sessionId,
                error,
            });
        }

        /**
         * Create business function wrapper for this call.
         */
        const functions = new AgentFunctions({
            sessionId,
        });

        /**
         * Load restaurant name for the greeting.
         */
        const restaurantResult = await functions.getRestaurant();

        const restaurant = restaurantResult.data as
            | {
                name?: string;
            }
            | undefined;

        const restaurantName = restaurant?.name ?? "the restaurant";

        /**
         * Register tools.
         */
        const tools = createAgentTools(functions);

        /**
         * Define the restaurant assistant.
         */
        const agent = new voice.Agent({
            instructions: `
${RESTAURANT_AGENT_INSTRUCTIONS}

CURRENT RESTAURANT:
Restaurant name: ${restaurantName}

CURRENT SESSION:
Session ID: ${sessionId}

IMPORTANT:
- Never tell the customer the session ID.
- Never mention internal tools, MongoDB, Redis, APIs, LiveKit, or Gemini.
- Never output function tags like <function=...>.
- Never output raw JSON.
- Always use menu tools before talking about menu items, prices, availability, or modifiers.
- If the customer wants to add an item, call getMenuItem first.
- If an item has required modifiers, ask the customer to choose them before calling addToCart.
- Only call placeOrder after summarizing the cart and getting clear confirmation.
`,
            tools,
        });

        /**
         * STT → LLM → TTS pipeline.
         */
        const agentSession = new voice.AgentSession({
            stt: new deepgram.STT({
                apiKey: deepgramApiKey,
                model: "nova-3",
                language: "en",
            }),

            llm: openai.LLM.withGroq({
                apiKey: groqApiKey,
                model: "openai/gpt-oss-120b",
                temperature: 0.2,
            }),

            tts: new deepgram.TTS({
                apiKey: deepgramApiKey,
                model: "aura-2-asteria-en",
            }),

            userAwayTimeout: 5 * 60 * 1000,
        });

        /**
         * Real LiveKit/Groq token + LLM latency tracking.
         */
        agentSession.on(
            voice.AgentSessionEventTypes.SessionUsageUpdated,
            async (event: any) => {
                try {
                    const modelUsage = event?.usage?.modelUsage ?? [];

                    for (const usage of modelUsage) {
                        if (usage.type !== "llm_usage") continue;

                        const promptTokens = Number(usage.inputTokens ?? 0);
                        const completionTokens = Number(usage.outputTokens ?? 0);
                        const totalTokens = promptTokens + completionTokens;

                        if (totalTokens <= 0) continue;

                        console.log("[LIVEKIT TOKEN SAVE]", {
                            sessionId,
                            promptTokens,
                            completionTokens,
                            totalTokens,
                        });

                        await analyticsService.recordTokenUsage(sessionId, {
                            provider: usage.provider,
                            model: usage.model,
                            promptTokens,
                            completionTokens,
                            totalTokens,
                            cachedPromptTokens: 0,
                            durationMs: 0,
                            ttftMs: 0,
                        });
                    }
                } catch (error) {
                    console.warn("[LIVEKIT USAGE ANALYTICS ERROR]", {
                        sessionId,
                        error,
                    });
                }
            },
        );

        await agentSession.start({
            agent,
            room: ctx.room,
            outputOptions: {
                transcriptionEnabled: true,
                syncTranscription: false,
            },
        });

        console.log(
            `Pipeline voice agent started for session: ${sessionId}`,
        );

        /**
         * Initial greeting.
         */
        agentSession.generateReply({
            instructions: `
Greet the customer now.

Say:
"Welcome to ${restaurantName}. How may I help you today? You can ask to hear the menu or place an order."

Keep it short and natural.
Do not read the menu yet.
Do not mention internal IDs.
`,
            allowInterruptions: true,
        });
    },
});