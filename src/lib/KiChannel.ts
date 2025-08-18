export interface BannerImage {
  src: string;
  srcset: string;
}

export interface CategoriesInfo {
  id: number
  category_id: number
  name: string
  slug: string
  tags: string[]
  description: string
  deleted_at: null | String
  is_mature: boolean
  is_promoted: boolean
  viewers: number
  is_fallback: boolean
  category: {
    id: number
    name: string
    slug: string
    icon: string
  }
}

export interface LiveStreamInfo {
  id: number
  slug: string
  channel_id: number
  created_at: `${number}-${number}-${number} ${number}:${number}:${number}`
  session_title: string
  is_live: boolean
  risk_level_id: null
  start_time: `${number}-${number}-${number} ${number}:${number}:${number}`
  source: null
  twitch_channel: null
  duration: number
  language: string
  is_mature: boolean
  viewer_count: number
  tags: string[]
  thumbnail: {
    responsive: string
    url: string
  }
  categories: CategoriesInfo[]

}

export interface SubscriberBadgesInfo {
  id: number
  channel_id: number
  months: number
  badge_image: {
    srcset: string
    src: string
  }
}

// Represents the full object from /info endpoint
export interface ChannelInfo {
  id: number;
  slug: string;
  verified: boolean;
  is_banned: boolean;
  playback_url: string;
  followers_count: number;
  subscription_enabled: boolean;
  livestream: LiveStreamInfo
  banner_image: BannerImage | null;
  offline_banner_image: BannerImage | null;
  subscriber_badges: SubscriberBadgesInfo
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

// Represents the full object from /chatroom endpoint
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
  pinned_message: any | null; // Type this properly if you have an example
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

export class KiChannel {
  public info: ChannelInfo;
  public chatroom: ChatroomInfo;
  public connectionNotified: boolean = false

  constructor(info: ChannelInfo, chatroom: ChatroomInfo) {
    this.info = info;
    this.chatroom = chatroom;
  }

  get id(): number {
    return this.info.id;
  }

  get name(): string {
    return this.info.user.username;
  }

  get slug(): string {
    return this.info.slug;
  }

  get chatroomId(): number {
    return this.info.chatroom.id;
  }

  get notified(): boolean {
    return this.connectionNotified
  }
  
  set notified(value: boolean) {
     this.connectionNotified = value
   }

  static toLogin(channelName: string) {
    const name = channelName.trim().toLowerCase();
    return name.startsWith('#') ? name.slice(1) : name;
  }

  toString() {
    return this.name;
  }
}