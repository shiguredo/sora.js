import { test } from '@playwright/test'

test('spotlight sendrecv x2', async ({ page }) => {
  await page.goto('http://localhost:9000/spotlight_sendrecv/')

  await page.click('#sendrecv1-connect')
  await page.click('#sendrecv2-connect')

  // #sendrecv1-connection-id 要素が存在し、その内容が空でないことを確認するまで待つ
  await page.waitForSelector('#sendrecv1-connection-id:not(:empty)')

  // #sendrecv1-connection-id 要素の内容を取得
  const sendrecv1ConnectionId = await page.$eval('#sendrecv1-connection-id', (el) => el.textContent)
  console.log(`sendrecv1 connectionId=${sendrecv1ConnectionId}`)

  // #sendrecv1-connection-id 要素が存在し、その内容が空でないことを確認するまで待つ
  await page.waitForSelector('#sendrecv1-connection-id:not(:empty)')

  // #sendrecv1-connection-id 要素の内容を取得
  const sendrecv2ConnectionId = await page.$eval('#sendrecv2-connection-id', (el) => el.textContent)
  console.log(`sendrecv2 connectionId=${sendrecv2ConnectionId}`)

  await page.click('#sendrecv1-disconnect')
  await page.click('#sendrecv2-disconnect')
})
