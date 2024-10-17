import { expect, test } from '@playwright/test'

test('sendrecv-different-video-codec-type x2', async ({ browser }) => {
  const sendrecv1 = await browser.newPage()
  const sendrecv2 = await browser.newPage()

  await sendrecv1.goto('http://localhost:9000/sendrecv/')
  await sendrecv2.goto('http://localhost:9000/sendrecv/')

  // チャンネル名を設定
  await sendrecv1.fill('#channel-name', 'sendrecv-different-video-codec-type')
  await sendrecv2.fill('#channel-name', 'sendrecv-different-video-codec-type')

  console.log('sendrecv1 channelName: sendrecv-different-video-codec-type')
  console.log('sendrecv2 channelName: sendrecv-different-video-codec-type')

  // sendrecv1 のビデオコーデックをランダムに選択
  await sendrecv1.evaluate(() => {
    const videoCodecTypeSelect = document.getElementById('video-codec-type') as HTMLSelectElement
    const options = Array.from(videoCodecTypeSelect.options).filter((option) => option.value !== '')
    const randomIndex = Math.floor(Math.random() * options.length)
    videoCodecTypeSelect.value = options[randomIndex].value
  })

  // sendrecv2 のビデオコーデックをランダムに選択
  await sendrecv2.evaluate(() => {
    const videoCodecTypeSelect = document.getElementById('video-codec-type') as HTMLSelectElement
    const options = Array.from(videoCodecTypeSelect.options).filter((option) => option.value !== '')
    const randomIndex = Math.floor(Math.random() * options.length)
    videoCodecTypeSelect.value = options[randomIndex].value
  })

  // 選択されたコーデックをログに出力
  const sendrecv1VideoCodecType = await sendrecv1.$eval(
    '#video-codec-type',
    (el) => (el as HTMLSelectElement).value,
  )
  const sendrecv2VideoCodecType = await sendrecv2.$eval(
    '#video-codec-type',
    (el) => (el as HTMLSelectElement).value,
  )
  console.log(`sendrecv1 videoCodecType: ${sendrecv1VideoCodecType}`)
  console.log(`sendrecv2 videoCodecType: ${sendrecv2VideoCodecType}`)

  await sendrecv1.click('#connect')
  await sendrecv2.click('#connect')

  // #connection-id 要素が存在し、その内容が空でないことを確認するまで待つ
  await sendrecv1.waitForSelector('#connection-id:not(:empty)')

  // #connection-id 要素の内容を取得
  const sendrecv1ConnectionId = await sendrecv1.$eval('#connection-id', (el) => el.textContent)
  console.log(`sendrecv1 connectionId=${sendrecv1ConnectionId}`)

  // #sendrecv1-connection-id 要素が存在し、その内容が空でないことを確認するまで待つ
  await sendrecv2.waitForSelector('#connection-id:not(:empty)')

  // #sendrecv1-connection-id 要素の内容を取得
  const sendrecv2ConnectionId = await sendrecv2.$eval('#connection-id', (el) => el.textContent)
  console.log(`sendrecv2 connectionId=${sendrecv2ConnectionId}`)

  // レース対策
  await sendrecv1.waitForTimeout(3000)
  await sendrecv2.waitForTimeout(3000)

  // page1 stats report

  // 'Get Stats' ボタンをクリックして統計情報を取得
  await sendrecv1.click('#get-stats')

  // 統計情報が表示されるまで待機
  await sendrecv1.waitForSelector('#stats-report')
  // データセットから統計情報を取得
  const sendrecv1StatsReportJson: Record<string, unknown>[] = await sendrecv1.evaluate(() => {
    const statsReportDiv = document.querySelector('#stats-report') as HTMLDivElement
    return statsReportDiv ? JSON.parse(statsReportDiv.dataset.statsReportJson || '[]') : []
  })

  const sendrecv1VideoCodecStats = sendrecv1StatsReportJson.find(
    (stats) => stats.type === 'codec' && stats.mimeType === `video/${sendrecv1VideoCodecType}`,
  )
  expect(sendrecv1VideoCodecStats).toBeDefined()

  const sendrecv1VideoOutboundRtpStats = sendrecv1StatsReportJson.find(
    (stats) => stats.type === 'outbound-rtp' && stats.kind === 'video',
  )
  expect(sendrecv1VideoOutboundRtpStats).toBeDefined()
  expect(sendrecv1VideoOutboundRtpStats?.bytesSent).toBeGreaterThan(0)
  expect(sendrecv1VideoOutboundRtpStats?.packetsSent).toBeGreaterThan(0)

  const sendrecv1VideoInboundRtpStats = sendrecv1StatsReportJson.find(
    (stats) => stats.type === 'inbound-rtp' && stats.kind === 'video',
  )
  expect(sendrecv1VideoInboundRtpStats).toBeDefined()
  expect(sendrecv1VideoInboundRtpStats?.bytesReceived).toBeGreaterThan(0)
  expect(sendrecv1VideoInboundRtpStats?.packetsReceived).toBeGreaterThan(0)

  // page2 stats report

  // 'Get Stats' ボタンをクリックして統計情報を取得
  await sendrecv2.click('#get-stats')

  // 統計情報が表示されるまで待機
  await sendrecv2.waitForSelector('#stats-report')
  // データセットから統計情報を取得
  const sendrecv2StatsReportJson: Record<string, unknown>[] = await sendrecv2.evaluate(() => {
    const statsReportDiv = document.querySelector('#stats-report') as HTMLDivElement
    return statsReportDiv ? JSON.parse(statsReportDiv.dataset.statsReportJson || '[]') : []
  })

  const sendrecv2VideoCodecStats = sendrecv2StatsReportJson.find(
    (stats) => stats.type === 'codec' && stats.mimeType === `video/${sendrecv2VideoCodecType}`,
  )
  expect(sendrecv2VideoCodecStats).toBeDefined()

  const sendrecv2VideoOutboundRtpStats = sendrecv2StatsReportJson.find(
    (stats) => stats.type === 'outbound-rtp' && stats.kind === 'video',
  )
  expect(sendrecv2VideoOutboundRtpStats).toBeDefined()
  expect(sendrecv2VideoOutboundRtpStats?.bytesSent).toBeGreaterThan(0)
  expect(sendrecv2VideoOutboundRtpStats?.packetsSent).toBeGreaterThan(0)

  const sendrecv2VideoInboundRtpStats = sendrecv2StatsReportJson.find(
    (stats) => stats.type === 'inbound-rtp' && stats.kind === 'video',
  )
  expect(sendrecv2VideoInboundRtpStats).toBeDefined()
  expect(sendrecv2VideoInboundRtpStats?.bytesReceived).toBeGreaterThan(0)
  expect(sendrecv2VideoInboundRtpStats?.packetsReceived).toBeGreaterThan(0)

  await sendrecv1.click('#disconnect')
  await sendrecv2.click('#disconnect')

  await sendrecv1.close()
  await sendrecv2.close()
})
