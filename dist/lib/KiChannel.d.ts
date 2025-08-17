export interface BannerImage {
    src: string;
    srcset: string;
}
export interface ChannelInfo {
    id: number;
    slug: string;
    verified: boolean;
    is_banned: boolean;
    playback_url: string;
    followers_count: number;
    subscription_enabled: boolean;
    livestream: any | null;
    banner_image: BannerImage | null;
    offline_banner_image: BannerImage | null;
    subscriber_badges: any[];
    user: {
        bio: string | null;
        username: string;
        instagram: string | null;
        twitter: string | null;
        youtube: string | null;
        discord: string | null;
        tiktok: string | null;
        facebook: string | null;
        profile_pic: string | null;
    };
    chatroom: {
        id: number;
    };
}
export interface ChatroomInfo {
    id: number;
    slow_mode: {
        enabled: boolean;
        message_interval: number;
    };
    subscribers_mode: {
        enabled: boolean;
    };
    followers_mode: {
        enabled: boolean;
        min_duration: number;
    };
    emotes_mode: {
        enabled: boolean;
    };
    advanced_bot_protection: {
        enabled: boolean;
        remaining_time: number;
    };
    pinned_message: any | null;
    show_quick_emotes: {
        enabled: boolean;
    };
    show_banners: {
        enabled: boolean;
    };
    gifts_enabled: {
        enabled: boolean;
    };
    gifts_week_enabled: {
        enabled: boolean;
    };
    gifts_month_enabled: {
        enabled: boolean;
    };
    account_age: {
        enabled: boolean;
        min_duration: number;
    };
}
export declare class KiChannel {
    info: ChannelInfo;
    chatroom: ChatroomInfo;
    constructor(info: ChannelInfo, chatroom: ChatroomInfo);
    get id(): number;
    get name(): string;
    get slug(): string;
    get chatroomId(): number;
    static toLogin(channelName: string): string;
    toString(): string;
}
