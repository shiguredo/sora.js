import {
  ConnectionOptions,
  Browser,
  JSONType,
  PreKeyBundle,
  Role,
  SignalingConnectMessage,
  SignalingNotifyMetadata,
  SignalingNotifyConnectionCreated,
  SignalingNotifyConnectionDestroyed,
  SignalingVideo,
} from "./types";

function browser(): Browser {
  const ua = window.navigator.userAgent.toLocaleLowerCase();
  if (ua.indexOf("edge") !== -1) {
    return "edge";
  } else if (ua.indexOf("chrome") !== -1 && ua.indexOf("edge") === -1) {
    return "chrome";
  } else if (ua.indexOf("safari") !== -1 && ua.indexOf("chrome") === -1) {
    return "safari";
  } else if (ua.indexOf("opera") !== -1) {
    return "opera";
  } else if (ua.indexOf("firefox") !== -1) {
    return "firefox";
  }
  return null;
}

function enabledSimulcast(role: Role, video: SignalingVideo): boolean {
  /**
    simulcast validator
    VP9 x

    simulcast_pub Chrome o
    simulcast_pub Firefox x
    simulcast_pub Safari <= 14 o
    simulcast_sub Chrome o
    simulcast_sub Firefox o
    simulcast_sub Safari <= 12.1 o
    simulcast_sub Safari 12.0 o ※H.264 のみ
  **/
  if (typeof video !== "boolean" && video.codec_type === "VP9") {
    return false;
  }
  if ((role === "sendrecv" || role === "sendonly") && browser() === "firefox") {
    return false;
  }
  if (browser() === "safari") {
    const appVersion = window.navigator.appVersion.toLowerCase();
    const versions = /version\/([\d.]+)/.exec(appVersion);
    if (!versions) {
      return false;
    }
    const versionString = versions.pop();
    if (!versionString) {
      return false;
    }
    const version = parseFloat(versionString);
    // 配信の場合は version 14.0 以降であれば有効
    if ((role === "sendrecv" || role === "sendonly") && 14.0 <= version) {
      return true;
    }
    // 視聴の場合
    if ((role === "recvonly") && 12.1 <= version) {
      // version 12.1 以降であれば有効
      if (12.1 <= version) {
        return true;
      }
      // version が 12.0 の場合 video codec type が H264 であれば有効
      if (12.0 == version && typeof video !== "boolean" && video.codec_type === "H264") {
        return true;
      }
    }
    return false;
  }
  return true;
}

export function isSafari(): boolean {
  return browser() === "safari";
}

export function isChrome(): boolean {
  return browser() === "chrome";
}

export function createSignalingMessage(
  offerSDP: string,
  role: string,
  channelId: string | null | undefined,
  metadata: JSONType | undefined,
  options: ConnectionOptions
): SignalingConnectMessage {
  if (
    role !== "sendrecv" &&
    role !== "sendonly" &&
    role !== "recvonly"
  ) {
    throw new Error("Unknown role type");
  }
  if (channelId === null || channelId === undefined) {
    throw new Error("channelId can not be null or undefined");
  }
  const message: SignalingConnectMessage = {
    type: "connect",
    // @ts-ignore
    sora_client: `Sora JavaScript SDK ${SORA_JS_SDK_VERSION}`,
    environment: window.navigator.userAgent,
    role: role,
    channel_id: channelId,
    sdp: offerSDP,
    audio: true,
    video: true,
  };

  if (metadata !== undefined) {
    message.metadata = metadata;
  }

  if ("signalingNotifyMetadata" in options) {
    message.signaling_notify_metadata = options.signalingNotifyMetadata;
  }
  if ("multistream" in options && options.multistream === true) {
    // multistream
    message.multistream = true;
    // spotlight
    if ("spotlight" in options) {
      message.spotlight = options.spotlight;
      if ("spotlightNumber" in options) {
        message.spotlight_number = options.spotlightNumber;
      }
    }
  }

  if ("simulcast" in options || "simulcastRid" in options) {
    // simulcast
    if ("simulcast" in options && options.simulcast === true) {
      message.simulcast = true;
    }
    const simalcastRids = ["r0", "r1", "r2"];
    if (options.simulcastRid !== undefined && 0 <= simalcastRids.indexOf(options.simulcastRid)) {
      message.simulcast_rid = options.simulcastRid;
    }
  }

  // client_id
  if ("clientId" in options && options.clientId !== undefined) {
    message.client_id = options.clientId;
  }

  // parse options
  const audioPropertyKeys = ["audioCodecType", "audioBitRate"];
  const audioOpusParamsPropertyKeys = [
    "audioOpusParamsChannels",
    "audioOpusParamsClockRate",
    "audioOpusParamsMaxplaybackrate",
    "audioOpusParamsStereo",
    "audioOpusParamsSpropStereo",
    "audioOpusParamsMinptime",
    "audioOpusParamsPtime",
    "audioOpusParamsUseinbandfec",
    "audioOpusParamsUsedtx",
  ];
  const videoPropertyKeys = ["videoCodecType", "videoBitRate"];
  const copyOptions = Object.assign({}, options);
  (Object.keys(copyOptions) as (keyof ConnectionOptions)[]).forEach((key) => {
    if (key === "audio" && typeof copyOptions[key] === "boolean") return;
    if (key === "video" && typeof copyOptions[key] === "boolean") return;
    if (0 <= audioPropertyKeys.indexOf(key) && copyOptions[key] !== null) return;
    if (0 <= audioOpusParamsPropertyKeys.indexOf(key) && copyOptions[key] !== null) return;
    if (0 <= videoPropertyKeys.indexOf(key) && copyOptions[key] !== null) return;
    delete copyOptions[key];
  });

  if (copyOptions.audio !== undefined) {
    message.audio = copyOptions.audio;
  }
  const hasAudioProperty = Object.keys(copyOptions).some((key) => {
    return 0 <= audioPropertyKeys.indexOf(key);
  });
  if (message.audio && hasAudioProperty) {
    message.audio = {};
    if ("audioCodecType" in copyOptions) {
      message.audio["codec_type"] = copyOptions.audioCodecType;
    }
    if ("audioBitRate" in copyOptions) {
      message.audio["bit_rate"] = copyOptions.audioBitRate;
    }
  }
  const hasAudioOpusParamsProperty = Object.keys(copyOptions).some((key) => {
    return 0 <= audioOpusParamsPropertyKeys.indexOf(key);
  });
  if (message.audio && hasAudioOpusParamsProperty) {
    if (typeof message.audio != "object") {
      message.audio = {};
    }
    message.audio.opus_params = {};
    if ("audioOpusParamsChannels" in copyOptions) {
      message.audio.opus_params.channels = copyOptions.audioOpusParamsChannels;
    }
    if ("audioOpusParamsClockRate" in copyOptions) {
      message.audio.opus_params.clock_rate = copyOptions.audioOpusParamsClockRate;
    }
    if ("audioOpusParamsMaxplaybackrate" in copyOptions) {
      message.audio.opus_params.maxplaybackrate = copyOptions.audioOpusParamsMaxplaybackrate;
    }
    if ("audioOpusParamsStereo" in copyOptions) {
      message.audio.opus_params.stereo = copyOptions.audioOpusParamsStereo;
    }
    if ("audioOpusParamsSpropStereo" in copyOptions) {
      message.audio.opus_params.sprop_stereo = copyOptions.audioOpusParamsSpropStereo;
    }
    if ("audioOpusParamsMinptime" in copyOptions) {
      message.audio.opus_params.minptime = copyOptions.audioOpusParamsMinptime;
    }
    if ("audioOpusParamsPtime" in copyOptions) {
      message.audio.opus_params.ptime = copyOptions.audioOpusParamsPtime;
    }
    if ("audioOpusParamsUseinbandfec" in copyOptions) {
      message.audio.opus_params.useinbandfec = copyOptions.audioOpusParamsUseinbandfec;
    }
    if ("audioOpusParamsUsedtx" in copyOptions) {
      message.audio.opus_params.usedtx = copyOptions.audioOpusParamsUsedtx;
    }
  }

  if (copyOptions.video !== undefined) {
    message.video = copyOptions.video;
  }
  const hasVideoProperty = Object.keys(copyOptions).some((key) => {
    return 0 <= videoPropertyKeys.indexOf(key);
  });
  if (message.video && hasVideoProperty) {
    message.video = {};
    if ("videoCodecType" in copyOptions) {
      message.video["codec_type"] = copyOptions.videoCodecType;
    }
    if ("videoBitRate" in copyOptions) {
      message.video["bit_rate"] = copyOptions.videoBitRate;
    }
  }

  if (message.simulcast && !enabledSimulcast(message.role, message.video)) {
    throw new Error("Simulcast can not be used with this browser");
  }

  if (options.e2ee === true) {
    if (message.signaling_notify_metadata === undefined) {
      message.signaling_notify_metadata = {};
    }
    if (message.signaling_notify_metadata === null || typeof message.signaling_notify_metadata !== "object") {
      throw new Error("E2EE failed. Options signalingNotifyMetadata must be type 'object'");
    }
    if (message.video === true) {
      message.video = {};
    }
    if (message.video) {
      message.video["codec_type"] = "VP8";
    }
    message.e2ee = true;
  }
  return message;
}

export function getSignalingNotifyAuthnMetadata(
  message: SignalingNotifyConnectionCreated | SignalingNotifyConnectionDestroyed | SignalingNotifyMetadata
): JSONType {
  if (message.authn_metadata !== undefined) {
    return message.authn_metadata;
  } else if (message.metadata !== undefined) {
    return message.metadata;
  }
  return null;
}

export function getSignalingNotifyData(message: SignalingNotifyConnectionCreated): SignalingNotifyMetadata[] {
  if (message.data && Array.isArray(message.data)) {
    return message.data;
  } else if (message.metadata_list && Array.isArray(message.metadata_list)) {
    return message.metadata_list;
  }
  return [];
}

export function getPreKeyBundle(message: JSONType): PreKeyBundle | null {
  if (typeof message === "object" && message !== null && "pre_key_bundle" in message) {
    return message.pre_key_bundle as PreKeyBundle;
  }
  return null;
}

export function trace(clientId: string | null, title: string, value: unknown): void {
  const dump = (record: unknown) => {
    if (record && typeof record === "object") {
      let keys = null;
      try {
        keys = Object.keys(JSON.parse(JSON.stringify(record)));
      } catch (_) {
        // 何もしない
      }
      if (keys && Array.isArray(keys)) {
        keys.forEach((key) => {
          console.group(key);
          dump((record as Record<string, unknown>)[key]);
          console.groupEnd();
        });
      } else {
        console.info(record);
      }
    } else {
      console.info(record);
    }
  };
  let prefix = "";
  if (window.performance) {
    prefix = "[" + (window.performance.now() / 1000).toFixed(3) + "]";
  }
  if (clientId) {
    prefix = prefix + "[" + clientId + "]";
  }

  if (console.info && console.group) {
    console.group(prefix + " " + title);
    dump(value);
    console.groupEnd();
  } else {
    console.log(prefix + " " + title + "\n", value);
  }
}

export class ConnectError extends Error {
  code?: number;
  reason?: string;
}
