export interface MessageEvent {
    event: string;
    data: string;
    channel: string;
}
type KnownBadgeType = 'subscriber' | 'sub_gifter' | 'moderator' | 'verified' | 'founder';
export interface GenericBadge {
    type: KnownBadgeType | (string & {});
    text: string;
}
type SubscriberBadge = GenericBadge & {
    type: 'subscriber';
    count: number;
};
type SubGifterBadge = GenericBadge & {
    type: 'sub_gifter';
    count: number;
};
type ModeratorBadge = GenericBadge & {
    type: 'moderator';
};
type VerifiedBadge = GenericBadge & {
    type: 'verified';
};
type FounderBadge = GenericBadge & {
    type: 'founder';
};
type BroadcasterBadge = GenericBadge & {
    type: 'broadcaster';
};
export type Badge = BroadcasterBadge | SubscriberBadge | SubGifterBadge | ModeratorBadge | VerifiedBadge | FounderBadge | GenericBadge;
interface Sender {
    id: number;
    username: string;
    slug: string;
    identity: {
        color: string;
        badges: Badge[];
    };
}
interface Clip {
    id: string;
    title: string;
    thumbnail_url: string;
    duration: number;
    creator: {
        id: number;
        username: string;
        slug: string;
        profile_picture: string;
    };
}
interface MessageBase {
    id: string;
    chatroom_id: number;
    content: string;
    created_at: string;
    sender: Sender;
}
interface MetadataBase {
    message_ref: string;
    clip?: Clip;
}
type StandardMessage = MessageBase & {
    type: 'message';
    metadata: MetadataBase;
};
type CelebrationMessage = MessageBase & {
    type: 'celebration';
    metadata: MetadataBase & {
        celebration: {
            id: string;
            type: 'subscription_renewed' | (string & {});
            total_months: number;
            created_at: string;
        };
    };
};
type ReplyMessage = MessageBase & {
    type: 'reply';
    metadata: MetadataBase & {
        original_sender: {
            id: string;
            username: string;
        };
        original_message: {
            id: string;
            content: string;
        };
    };
};
export type MessageData = StandardMessage | CelebrationMessage | ReplyMessage;
export interface SubscriptionData {
    username: string;
    months: number;
}
export interface ChatMessage {
    id: string;
    chatroom_id: number;
    content: string;
    type: string;
    created_at: string;
    sender: {
        id: number;
        username: string;
        slug: string;
        identity: {
            color: string;
            badges: Badge[];
        };
    };
    "metadata": MessageData['metadata'];
}
export interface Subscription {
    chatroom_id: number;
    username: string;
    months: number;
}
export interface GiftedSubscriptionsEvent {
    chatroom_id: number;
    gifted_usernames: string[];
    gifter_username: string;
    gifter_total: number;
}
export interface StreamHostEvent {
    chatroom_id: number;
    optional_message: string;
    number_viewers: number;
    host_username: string;
}
export interface MessageDeletedEvent {
    id: string;
    message: {
        id: string;
    };
    aiModerated: boolean;
    violatedRules: any[];
}
export interface UserBanned {
    id: string;
    user: {
        id: number;
        username: string;
        slug: string;
    };
    banned_by: {
        id: number;
        username: string;
        slug: string;
    };
}
type UserBannedPermanent = UserBanned & {
    permanent: true;
};
type UserBannedTemporary = UserBanned & {
    permanent: false;
    duration: number;
    expires_at: string;
};
export type UserBannedEvent = UserBannedPermanent | UserBannedTemporary;
export interface UserUnbannedEvent {
    id: string;
    user: {
        id: number;
        username: string;
        slug: string;
    };
    unbanned_by: {
        id: number;
        username: string;
        slug: string;
    };
    permanent: false;
}
export interface PinnedMessageCreatedEvent {
    message: {
        id: string;
        chatroom_id: number;
        content: string;
        type: string;
        created_at: string;
        sender: {
            id: number;
            username: string;
            slug: string;
            identity: {
                color: string;
                badges: Badge[];
            };
        };
        metadata: null;
    };
    duration: string;
}
export interface StreamerIsLiveEvent {
    livestream: {
        id: number;
        channel_id: number;
        session_title: string;
        source: String | null;
        created_at: string;
    };
}
export interface StopStreamBroadcastEvent {
    livestream: {
        id: number;
        channel: {
            id: number;
            is_banned: false;
        };
    };
}
export interface PollUpdateEvent {
    poll: {
        title: string;
        options: {
            id: number;
            label: string;
            votes: number;
        }[];
        duration: number;
        remaining: number;
        result_display_duration: number;
        has_voted: boolean;
        voted_option_id: null;
    };
}
export interface GoalEvent {
    id: string;
    channel_id: string;
    type: "followers" | String;
    status: "active" | "canceled" | String;
    target_value: number;
    current_value: number;
    progress_bar_emoji_id: string;
    end_date: string | null;
    achieved_at: null;
    created_at: string;
    updated_at: string;
    count_from_creation: boolean;
}
export interface LivestreamUpdatedEvent {
    livestream: {
        id: number;
        slug: string;
        channel_id: number;
        created_at: string;
        session_title: string;
        is_live: boolean;
        risk_level_id: null | string;
        start_time: string;
        source: null | string;
        twitch_channel: null | string;
        duration: number;
        language: string;
        is_mature: boolean;
        viewer_count: number;
        tags: string[];
        lang_iso: string;
        categories: {
            id: number;
            category_id: number;
            name: string;
            slug: string;
            tags: string[];
            description: null | string;
            deleted_at: null | string;
            is_mature: boolean;
            is_promoted: boolean;
            viewers: number;
            is_fallback: boolean;
            category: {
                id: number;
                name: string;
                slug: string;
                icon: string;
            };
        }[];
    };
}
export interface PredictionBase {
    id: string;
    channel_id: number;
    title: string;
    outcomes: {
        id: string;
        title: string;
        total_vote_amount: number;
        vote_count: number;
        return_rate: number;
        top_users: {
            user_id: number;
            username: string;
            amount: number;
        }[];
    };
    duration: number;
    created_at: string;
    updated_at: string;
}
type ActivePrediction = PredictionBase & {
    state: "ACTIVE";
};
type LockedPrediction = PredictionBase & {
    state: "LOCKED";
    locked_at: string;
};
type ResolvedPrediction = PredictionBase & {
    state: "RESOLVED";
    locked_at: string;
    winning_outcome_id: string;
};
export type PredictionEvent = {
    prediction: ActivePrediction | LockedPrediction | ResolvedPrediction;
};
export interface RewardRedeemedEvent {
    reward_title: string;
    user_id: number;
    channel_id: number;
    username: string;
    user_input: "" | String;
    reward_background_color: `#${string}`;
}
export interface ConnectionEstablishedEvent {
    socket_id: `${number}.${number}`;
    activity_timeout: number;
}
export interface SubscriptionSuccededEvent {
    channel: string;
    data: {};
}
export interface PusherErrorEvent {
    code: 4200 | Number;
    message: string;
}
export interface ChannelSubscriptionEvent {
    user_ids: number[];
    username: string;
    channel_id: number;
}
export interface ChatroomUpdatedEvent {
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
    account_age: {
        enabled: boolean;
        min_duration: number;
    };
}
export interface LuckyUsersWhoGotGiftSubscriptionsEvent {
    channel: {
        id: number;
        user_id: number;
        slug: string;
        is_banned: boolean;
        playback_url: string;
        name_updated_at: string | null;
        vod_enabled: boolean;
        subscription_enabled: boolean;
        is_affiliate: boolean;
        can_host: boolean;
        chatroom: {
            id: number;
            chatable_type: string;
            channel_id: number;
            created_at: string;
            updated_at: string;
            chat_mode_old: string;
            chat_mode: string;
            slow_mode: boolean;
            chatable_id: number;
            followers_mode: boolean;
            subscribers_mode: boolean;
            emotes_mode: boolean;
            message_interval: number;
            following_min_duration: number;
        };
    };
    usernames: string[];
    gifter_username: string;
}
export interface VideoPrivatedEvent {
    video_id: string;
}
export interface GiftsLeaderboardUpdatedEvent {
    leaderboard: {
        user_id: number;
        username: string;
        quantity: number;
    }[];
    weekly_leaderboard: {
        user_id: number;
        username: string;
        quantity: number;
    }[];
    monthly_leaderboard: {
        user_id: number;
        username: string;
        quantity: number;
    }[];
    gifter_id: number;
    gifter_username: string;
    gifted_quantity: number;
}
export interface ChatMoveToSupportedChannelEvent {
    channel: {
        id: number;
        user_id: number;
        slug: string;
        is_banned: boolean;
        playback_url: string;
        name_updated_at: string | null;
        vod_enabled: boolean;
        subscription_enabled: boolean;
        is_affiliate: boolean;
        can_host: boolean;
        current_livestream: {
            id: number;
            slug: string;
            channel_id: number;
            created_at: string;
            session_title: string;
            is_live: boolean;
            risk_level_id: null | string;
            start_time: string;
            source: null | string;
            twitch_channel: null | string;
            duration: number;
            language: string;
            is_mature: boolean;
            viewer_count: number;
        };
    };
    slug: string;
    hosted: {
        id: number;
        username: string;
        slug: string;
        viewers_count: number;
        is_live: boolean;
        profile_pic: string;
        category: string;
        preview_thumbnail: {
            srcset: string;
            src: string;
        };
    };
}
export {};
