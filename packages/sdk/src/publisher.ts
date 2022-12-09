import ConnectionBase from "./base";
import {
  createLyraDecoder,
  createLyraEncoder,
  isLyraInitialized,
  transformLyraToPcm,
  transformPcmToLyra,
} from "./lyra";
import { RTCEncodedAudioFrame } from "./types";

/**
 * Role が "sendonly" または "sendrecv" の場合に Sora との WebRTC 接続を扱うクラス
 */
export default class ConnectionPublisher extends ConnectionBase {
  /**
   * Sora へ接続するメソッド
   *
   * @example
   * ```typescript
   * const sendrecv = connection.sendrecv("sora");
   * const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
   * await sendrecv.connect(mediaStream);
   * ```
   *
   * @param stream - メディアストリーム
   *
   * @public
   */
  async connect(stream: MediaStream): Promise<MediaStream> {
    if (this.options.multistream) {
      await Promise.race([
        this.multiStream(stream).finally(() => {
          this.clearConnectionTimeout();
          this.clearMonitorSignalingWebSocketEvent();
        }),
        this.setConnectionTimeout(),
        this.monitorSignalingWebSocketEvent(),
      ]);
    } else {
      await Promise.race([
        this.singleStream(stream).finally(() => {
          this.clearConnectionTimeout();
          this.clearMonitorSignalingWebSocketEvent();
        }),
        this.setConnectionTimeout(),
        this.monitorSignalingWebSocketEvent(),
      ]);
    }
    this.monitorWebSocketEvent();
    this.monitorPeerConnectionState();
    return stream;
  }

  /**
   * シングルストリームで Sora へ接続するメソッド
   *
   * @param stream - メディアストリーム
   */
  private async singleStream(stream: MediaStream): Promise<MediaStream> {
    await this.disconnect();
    this.setupE2EE();
    const ws = await this.getSignalingWebSocket(this.signalingUrlCandidates);
    const signalingMessage = await this.signaling(ws);
    this.startE2EE();
    await this.connectPeerConnection(signalingMessage);
    await this.setRemoteDescription(signalingMessage);
    stream.getTracks().forEach((track) => {
      if (this.pc) {
        this.pc.addTrack(track, stream);
      }
    });
    this.stream = stream;
    await this.createAnswer(signalingMessage);
    this.sendAnswer();
    if (this.pc && this.e2ee) {
      this.pc.getSenders().forEach((sender) => {
        if (this.e2ee) {
          this.e2ee.setupSenderTransform(sender);
        }
      });
    }
    await this.onIceCandidate();
    await this.waitChangeConnectionStateConnected();
    return stream;
  }

  /**
   * マルチストリームで Sora へ接続するメソッド
   *
   * @param stream - メディアストリーム
   */
  private async multiStream(stream: MediaStream): Promise<MediaStream> {
    await this.disconnect();
    this.setupE2EE();
    const ws = await this.getSignalingWebSocket(this.signalingUrlCandidates);
    const signalingMessage = await this.signaling(ws);
    this.startE2EE();
    await this.connectPeerConnection(signalingMessage);
    if (this.pc) {
      this.pc.ontrack = async (event): Promise<void> => {
        if (isLyraInitialized()) {
          // @ts-ignore
          // eslint-disable-next-line
          const receiverStreams = event.receiver.createEncodedStreams();
          const isLyraCodec = this.audioMidToCodec.get(event.transceiver.mid || "") === "LYRA";
          if (isLyraCodec) {
            // TODO: 不要になったら destroy を呼びたい
            const lyraDecoder = await createLyraDecoder({ sampleRate: 16000 });
            // eslint-disable-next-line
            const transformStream = new TransformStream({
              transform: (data: RTCEncodedAudioFrame, controller) => transformLyraToPcm(lyraDecoder, data, controller),
            });
            // eslint-disable-next-line
            receiverStreams.readable.pipeThrough(transformStream).pipeTo(receiverStreams.writable);
          } else {
            // eslint-disable-next-line
            receiverStreams.readable.pipeTo(receiverStreams.writable);
          }
        }

        const stream = event.streams[0];
        if (!stream) {
          return;
        }
        const data = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "stream.id": stream.id,
          id: event.track.id,
          label: event.track.label,
          enabled: event.track.enabled,
          kind: event.track.kind,
          muted: event.track.muted,
          readyState: event.track.readyState,
        };
        this.writePeerConnectionTimelineLog("ontrack", data);
        if (stream.id === "default") {
          return;
        }
        if (stream.id === this.connectionId) {
          return;
        }
        if (this.e2ee) {
          this.e2ee.setupReceiverTransform(event.receiver);
        }
        this.callbacks.track(event);
        stream.onremovetrack = (event): void => {
          this.callbacks.removetrack(event);
          if (event.target) {
            // @ts-ignore TODO(yuito): 後方互換のため peerConnection.onremovestream と同じ仕様で残す
            const index = this.remoteConnectionIds.indexOf(event.target.id as string);
            if (-1 < index) {
              delete this.remoteConnectionIds[index];
              // @ts-ignore TODO(yuito): 後方互換のため peerConnection.onremovestream と同じ仕様で残す
              event.stream = event.target;
              this.callbacks.removestream(event);
            }
          }
        };
        if (-1 < this.remoteConnectionIds.indexOf(stream.id)) {
          return;
        }
        // @ts-ignore TODO(yuito): 最新ブラウザでは無くなった API だが後方互換のため残す
        event.stream = stream;
        this.remoteConnectionIds.push(stream.id);
        this.callbacks.addstream(event);
      };
    }
    await this.setRemoteDescription(signalingMessage);
    stream.getTracks().forEach((track) => {
      if (this.pc) {
        this.pc.addTrack(track, stream);
      }
    });
    if (this.pc) {
      if (isLyraInitialized()) {
        for (const sender of this.pc.getSenders()) {
          if (sender == undefined || sender.track == undefined) {
            continue;
          }

          // @ts-ignore
          // eslint-disable-next-line
          const senderStreams = sender.createEncodedStreams();
          const isLyraCodec = sender.track.kind === "audio" && this.options.audioCodecType === "LYRA";
          if (isLyraCodec) {
            if (this.lyraEncodeOptions === undefined) {
              throw new Error("TODO");
            }
            const lyraEncoder = await createLyraEncoder({
              sampleRate: 16000,
              bitrate: this.lyraEncodeOptions.bitrate,
              enableDtx: this.lyraEncodeOptions.enableDtx,
            });
            const transformStream = new TransformStream({
              transform: (data: RTCEncodedAudioFrame, controller) => transformPcmToLyra(lyraEncoder, data, controller),
            });
            // eslint-disable-next-line
            senderStreams.readable.pipeThrough(transformStream).pipeTo(senderStreams.writable);
          } else {
            // eslint-disable-next-line
            senderStreams.readable.pipeTo(senderStreams.writable);
          }
        }
      }
    }

    this.stream = stream;
    await this.createAnswer(signalingMessage);
    this.sendAnswer();
    if (this.pc && this.e2ee) {
      this.pc.getSenders().forEach((sender) => {
        if (this.e2ee) {
          this.e2ee.setupSenderTransform(sender);
        }
      });
    }
    await this.onIceCandidate();
    await this.waitChangeConnectionStateConnected();
    return stream;
  }
}
