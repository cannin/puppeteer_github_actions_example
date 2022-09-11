import puppeteer from 'puppeteer-core'
import { type } from 'os'
import { normalize } from 'path'
import * as fs from 'fs'

if (!process.env.GITHUB_ACTIONS) {
  console.log('Running locally')
}

function getChromePath() {
  let browserPath

  // This will not work on Windows
  if (type() === 'Linux') {
    browserPath = '/usr/bin/google-chrome'
  } else if (type() === 'Darwin') {
    browserPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  }

  if (browserPath && browserPath.length > 0) {
    return normalize(browserPath)
  }

  throw new TypeError(`Cannot run action. ${type} is not supported.`)
}

try {
  const url = 'https://www.cnn.com/markets/fear-and-greed'

  const width = 1920
  const height = 1080

  const date = ((new Date()).toISOString()).replaceAll(':', '-').replaceAll('.', '-')

  console.log(`\nLaunching at ${date} using ${width}x${height}.`)

  const browser = await puppeteer.launch({
    ...(process.env.ACT && { args: ['--no-sandbox', '--disable-setuid-sandbox'] }), // ? For local testing purposes (nektos/act)
    executablePath: getChromePath(),
    defaultViewport: { width, height }
    // headless: false,
    // slowMo: 250,
  })

  console.log('Awaiting page...')
  const page = await browser.newPage()

  console.log('Going to URL...\n')
  await page.goto(url, {
    waitUntil: 'networkidle2'
  })

  console.log('Evaluating Javascript...\n')
  const dat = await page.evaluate("window.CNNB_FNG.fear_and_greed");
  console.log('Data: ' + JSON.stringify(dat) + '\n')

  console.log('Write to file...\n')
  await fs.writeFileSync("result.json", JSON.stringify(dat))

  console.log('Closing Browser...\n')
  await browser.close()

} catch (error) {
  console.log(`Failed to run. ${error}`)
  process.exit(1)
}
