export type FindStreamResult = {
  isLive: boolean;
  url?: string;
};
export type CheckStatusResult = {
  isChannelPage: boolean;
  loginUrl?: string;
  isStream: boolean;
  isStreamWaiting: boolean;
  isStreamRewards: boolean;
  isVideoIdMismatch: boolean;
  channelId?: string;
  videoId?: string;
  urlVideoId: string | null;
};
export type Payload =
  | {
      type: 'start';
      start: boolean;
    }
  | {
      type: 'status';
      status: CheckStatusResult;
      message?: string;
      icon?: string;
    };
