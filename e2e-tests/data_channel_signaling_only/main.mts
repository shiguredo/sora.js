import Sora, {
  type SignalingNotifyMessage,
  type SignalingEvent,
  type ConnectionPublisher,
  type SoraConnection,
  type ConnectionOptions,
} from 'sora-js-sdk'

document.addEventListener('DOMContentLoaded', async () => {
  const signalingUrl = import.meta.env.VITE_TEST_SIGNALING_URL
  const channelIdPrefix = import.meta.env.VITE_TEST_CHANNEL_ID_PREFIX || ''
  const channelIdSuffix = import.meta.env.VITE_TEST_CHANNEL_ID_SUFFIX || ''
  const secretKey = import.meta.env.VITE_TEST_SECRET_KEY
  const apiUrl = import.meta.env.VITE_TEST_API_URL

  const client = new SoraClient(signalingUrl, channelIdPrefix, channelIdSuffix, secretKey, apiUrl)

  // SDK バージョンの表示
  const sdkVersionElement = document.querySelector('#sdk-version')
  if (sdkVersionElement) {
    sdkVersionElement.textContent = `${Sora.version()}`
  }

  document.querySelector('#connect')?.addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    await client.connect(stream)
  })

  document.querySelector('#disconnect')?.addEventListener('click', async () => {
    await client.disconnect()
  })

  document.querySelector('#disconnect-api')?.addEventListener('click', async () => {
    await client.apiDisconnect()
  })

  document.querySelector('#get-stats')?.addEventListener('click', async () => {
    const statsReport = await client.getStats()
    const statsDiv = document.querySelector('#stats-report') as HTMLElement
    const statsReportJsonDiv = document.querySelector('#stats-report-json')
    if (statsDiv && statsReportJsonDiv) {
      let statsHtml = ''
      const statsReportJson: Record<string, unknown>[] = []
      for (const report of statsReport.values()) {
        statsHtml += `<h3>Type: ${report.type}</h3><ul>`
        const reportJson: Record<string, unknown> = { id: report.id, type: report.type }
        for (const [key, value] of Object.entries(report)) {
          if (key !== 'type' && key !== 'id') {
            statsHtml += `<li><strong>${key}:</strong> ${value}</li>`
            reportJson[key] = value
          }
        }
        statsHtml += '</ul>'
        statsReportJson.push(reportJson)
      }
      statsDiv.innerHTML = statsHtml
      // データ属性としても保存（オプション）
      statsDiv.dataset.statsReportJson = JSON.stringify(statsReportJson)
    }
  })
})

class SoraClient {
  private debug = false
  private channelId: string
  private metadata: { access_token: string }
  private options: ConnectionOptions = {
    dataChannelSignaling: true,
    ignoreDisconnectWebSocket: true,
  }

  private sora: SoraConnection
  private connection: ConnectionPublisher

  private apiUrl: string

  constructor(
    signalingUrl: string,
    channelIdPrefix: string,
    channelIdSuffix: string,
    secretKey: string,
    apiUrl: string,
  ) {
    this.apiUrl = apiUrl

    this.sora = Sora.connection(signalingUrl, this.debug)

    // channel_id の生成
    this.channelId = `${channelIdPrefix}sendonly_recvonly${channelIdSuffix}`
    // access_token を指定する metadata の生成
    this.metadata = { access_token: secretKey }

    this.connection = this.sora.sendonly(this.channelId, this.metadata, this.options)
    this.connection.on('notify', this.onNotify.bind(this))

    // E2E テスト用のコード
    this.connection.on('signaling', this.onSignaling.bind(this))
  }

  async connect(stream: MediaStream): Promise<void> {
    await this.connection.connect(stream)

    const videoElement = document.querySelector<HTMLVideoElement>('#local-video')
    if (videoElement !== null) {
      videoElement.srcObject = stream
    }
  }

  async disconnect(): Promise<void> {
    await this.connection.disconnect()

    const videoElement = document.querySelector<HTMLVideoElement>('#local-video')
    if (videoElement !== null) {
      videoElement.srcObject = null
    }
  }

  getStats(): Promise<RTCStatsReport> {
    if (this.connection.pc === null) {
      return Promise.reject(new Error('PeerConnection is not ready'))
    }
    return this.connection.pc.getStats()
  }

  private onNotify(event: SignalingNotifyMessage): void {
    if (
      event.event_type === 'connection.created' &&
      this.connection.connectionId === event.connection_id
    ) {
      const connectionIdElement = document.querySelector('#connection-id')
      if (connectionIdElement) {
        connectionIdElement.textContent = event.connection_id
      }
    }
  }

  // E2E テスト用のコード
  private onSignaling(event: SignalingEvent): void {
    if (event.type === 'onmessage-switched') {
      console.log('[signaling]', event.type, event.transportType)
    }
    if (event.type === 'onmessage-close') {
      console.log('[signaling]', event.type, event.transportType)
    }
  }

  // E2E テスト側で実行した方が良い気がする
  async apiDisconnect(): Promise<void> {
    if (!this.apiUrl) {
      throw new Error('VITE_TEST_API_URL is not set')
    }
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sora-Target': 'Sora_20151104.DisconnectConnection',
      },
      body: JSON.stringify({
        channel_id: this.channelId,
        connection_id: this.connection.connectionId,
      }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  }
}
