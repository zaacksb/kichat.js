import EventEmitter from "./lib/EventEmitter";
import { KiChannel, ChannelInfo, ChatroomInfo } from "./lib/KiChannel";
import * as KickEvents from "./types/events";
import type { WebSocket as NodeWebSocket } from 'ws';
export declare const parseJSON: <T>(json: string) => T | null;
export interface ClientOptions {
    channels?: string[];
    reconnect?: boolean;
    reconnectMaxAttempts?: number;
    reconnectInitialTimeout?: number;
    reconnectMaxTimeout?: number;
}
export type ConnectionEvents = {
    connected: [];
    disconnected: [reason: string];
    reconnecting: [];
    socketError: [error: Error];
    join: [channel: KiChannel];
    leave: [channel: KiChannel, reason?: string];
};
export type ChatEvents = {
    message: [message: KickEvents.MessageData, channel: KiChannel];
    subscription: [message: KickEvents.Subscription, channel: KiChannel];
    giftedSubscriptions: [message: KickEvents.GiftedSubscriptionsEvent, channel: KiChannel];
    streamHost: [message: KickEvents.StreamHostEvent, channel: KiChannel];
    userBanned: [message: KickEvents.UserBannedEvent, channel: KiChannel];
    userUnbanned: [message: KickEvents.UserUnbannedEvent, channel: KiChannel];
    messageDeleted: [message: KickEvents.MessageDeletedEvent, channel: KiChannel];
    pinnedMessageCreated: [message: KickEvents.PinnedMessageCreatedEvent, channel: KiChannel];
    pinnedMessageDeleted: [message: KickEvents.MessageDeletedEvent, channel: KiChannel];
    chatroomUpdated: [message: KickEvents.ChatroomUpdatedEvent, channel: KiChannel];
    pollUpdate: [message: KickEvents.PollUpdateEvent, channel: KiChannel];
    pollDelete: [channel: KiChannel];
    streamerIsLive: [message: KickEvents.StreamerIsLiveEvent, channel: KiChannel];
    stopStreamBroadcast: [message: KickEvents.StopStreamBroadcastEvent, channel: KiChannel];
    goalCreated: [message: KickEvents.GoalEvent, channel: KiChannel];
    goalCanceled: [message: KickEvents.GoalEvent, channel: KiChannel];
    goalProgressUpdate: [message: KickEvents.GoalEvent, channel: KiChannel];
    livestreamUpdated: [message: KickEvents.LivestreamUpdatedEvent, channel: KiChannel];
    predictionCreated: [message: {
        prediction: KickEvents.PredictionBase & {
            state: "ACTIVE";
        };
    }, channel: KiChannel];
    predictionUpdated: [message: KickEvents.PredictionEvent, channel: KiChannel];
    rewardRedeemed: [message: KickEvents.RewardRedeemedEvent, channel: KiChannel];
    channelSubscription: [message: KickEvents.ChannelSubscriptionEvent, channel: KiChannel];
    luckyUsersWhoGotGiftSubscriptions: [message: KickEvents.LuckyUsersWhoGotGiftSubscriptionsEvent, channel: KiChannel];
    videoPrivated: [message: KickEvents.VideoPrivatedEvent, channel: KiChannel];
    giftsLeaderboardUpdated: [message: KickEvents.GiftsLeaderboardUpdatedEvent, channel: KiChannel];
    chatMoveToSupportedChannel: [message: KickEvents.ChatMoveToSupportedChannelEvent, channel: KiChannel];
};
export type ClientEvents = ConnectionEvents & ChatEvents & {
    raw: [data: string];
};
export declare class KiChatjs extends EventEmitter<ClientEvents> {
    socket?: WebSocket | NodeWebSocket;
    private wasCloseCalled;
    private reconnectAttempts;
    private pingInterval?;
    private socketSession;
    private reconnectEnabled;
    private reconnectMaxAttempts;
    private reconnectInitialTimeout;
    private reconnectMaxTimeout;
    channels: Map<string, KiChannel>;
    channelsByChatroomId: Map<number, KiChannel>;
    constructor(options?: ClientOptions);
    isConnected(): this is {
        socket: WebSocket & {
            readyState: 1;
        };
    };
    connect(): void;
    private createWebSocket;
    close(): void;
    private reconnect;
    private onSocketOpen;
    private onSocketClose;
    private onSocketError;
    private onSocketMessage;
    private sendPusher;
    private startPing;
    private subscribeToChannel;
    fetchUserInfo(channelName: string): Promise<ChannelInfo | undefined>;
    fetchChatRoom(channelName: string): Promise<ChatroomInfo | undefined>;
    join(channelName: string): Promise<KiChannel>;
    leave(channelName: string): void;
    private waitForEvent;
}
