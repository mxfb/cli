import process from 'node:process'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import prompts from 'prompts'
import puppeteer from 'puppeteer'
import { program } from 'commander'
import { JSDOM } from 'jsdom'
import wait from '@design-edito/tools/utils/agnostic/wait/index.js'
import roundNumbers from '@design-edito/tools/utils/agnostic/round-numbers/index.js'
import { beforeForcedExit, beforeExit } from '@design-edito/tools/utils/node/process-exit/index.js'

const browser = await puppeteer.launch()
beforeExit(async () => browser.close())
beforeForcedExit(async () => browser.close())

program
  .name('@design-edito/tumblr-crawler')
  .description('Crawls a Tumblr blog')

program
  .command('shallow')
  .description('Fetch all pages DOM content')
  .argument('url', 'Root URL of the tumblr blog')
  .action(async inputUrl => {
    const { outputPath } = await prompts({
      type: 'text',
      name: 'outputPath',
      message: 'Please select an output path for the data files',
      initial: `${process.cwd()}/.tmblrcrwlr`
    }) as { outputPath: string }
    const trimmedInput = inputUrl.trim()
    const urlChunks = [trimmedInput]
    if (!/^https?:\/\//i.test(trimmedInput)) {
      if (trimmedInput.startsWith('://')) urlChunks.unshift('https')
      else urlChunks.unshift('https://')
    }
    const url = new URL(urlChunks.join(''))
    const stringifiedUrl = url.toString().replace(/\/+$/igm, '')
    console.log('you wanna crawl', stringifiedUrl)
    const shallowJson = await fetchPagesDom(stringifiedUrl, outputPath)
    const shallowJsonContent = JSON.stringify(shallowJson, null, 2)
    const outputShallowJsonPath = path.join(outputPath, `shallow.json`)
    console.log(`outputting fetched data (${shallowJson.length}) pages`)
    await fs.mkdir(outputPath, { recursive: true })
    await fs.writeFile(outputShallowJsonPath, shallowJsonContent, { encoding: 'utf-8' })
    console.log('Wrote data at', outputShallowJsonPath)
    await browser.close()
  })

program
  .command('analyze')
  .description('Analyzes post data from the outputs of tumblr-crawler shallow <url>')
  .action(async () => {
    const { shallowJsonPath } = await prompts({
      type: 'text',
      name: 'shallowJsonPath',
      message: 'Please enter a shallow.json file path',
      initial: `${process.cwd()}/.tmblrcrwlr/shallow.json`
    })
    const shallowJsonContent = await fs.readFile(shallowJsonPath, { encoding: 'utf-8' })
    const shallowJsonObj = JSON.parse(shallowJsonContent) as ShallowJson
    const analyzedPages = await analyzePages(shallowJsonObj)
    const postsDataObj = Object.fromEntries(analyzedPages)
    const postsDataContent = JSON.stringify(postsDataObj, null, 2)
    const analyzedPath = path.join(path.dirname(shallowJsonPath), 'analyzed.json')
    await fs.writeFile(analyzedPath, postsDataContent, { encoding: 'utf-8' })
    await browser.close()
  })
  
program.parse(process.argv)

type PageData = {
  isValid: boolean
  domString: string
  dom: JSDOM | null
  url: string
}

type ShallowJson = Array<{
  number: number
  url: string
  content: string
  isValid: boolean
}>

async function fetchPagesDom (rootUrl: string, outputPath: string, startOffset: number = 0)  {
  const pagesMap = new Map<number, PageData>()
  let pagePos = 0 + startOffset
  try {
    while (true) {
      pagePos ++
      const url = `${rootUrl}/page/${pagePos}`
      if (pagePos > 200) break;
      console.log(url, '...')
      const domString = await fetchPostsPageContent(pagePos, rootUrl)
      if (domString === undefined) {
        pagesMap.set(pagePos, { isValid: false, domString: '', dom: null, url })
        break;
      }
      const { isValid, dom } = await validatePageContent(domString)
      pagesMap.set(pagePos, { isValid, domString, dom, url })
      if (!isValid) break;
      const delay = (Math.random() * 2000) + 2000
      console.log(`Waiting before new request... (${roundNumbers(delay / 1000, 1)}s)\n\n`)
      await wait(delay)
    }
  } catch (err) {
    console.log('Something went wrong while crawling...')
    console.log(err)
  }
  const shallowJson: ShallowJson = []
  pagesMap.forEach((pageData, pagePos) => {
    shallowJson.push({
      number: pagePos,
      url: pageData.url,
      content: pageData.domString,
      isValid: pageData.isValid
    })
  })
  return shallowJson
}

async function fetchPostsPageContent (pagePos: number, rootUrl: string) {
  const isInteger = Number.isInteger(pagePos)
  if (!isInteger || pagePos <= 0) throw new Error(`Page number must be a non-zero positive integer. Found: ${pagePos}`)
  // const page = await browser.newPage()
  // page.goto(`${rootUrl}/page/${pagePos}`, { waitUntil: 'networkidle2' })
  // await page.waitForNavigation()
  // await wait(1000)
  // const content = await page.evaluate(() => {
  //   try { return document.documentElement.outerHTML }
  //   catch { return undefined }
  // })
  // page.close()
  return await (await fetch(`${rootUrl}/page/${pagePos}`)).text()
  // return content
}

type PageValidationResult = {
  isValid: boolean
  dom: JSDOM
}

async function validatePageContent (pageContent: string): Promise<PageValidationResult> {
  const dom = new JSDOM(pageContent)
  const { window: { document } } = dom
  const page = document.querySelector('#page')
  if (page === null) return { isValid: false, dom }
  const content = page.querySelector('#content')
  if (content === null) return { isValid: false, dom }
  const posts = content.querySelectorAll('article.post')
  if (posts.length === 0) return { isValid: false, dom }
  return { isValid: true, dom }
}

type PostData = {
  id: string
  url: string | null
  date: string | null
  type: string | null
  post_element_outerhtml: string | null
  post_content: string | null
  youtube_id: string | null
  youtube_title: string | null
}

async function analyzePages (shallowJson: ShallowJson): Promise<Map<string, PostData>> {
  const postsData = new Map<string, PostData>()
  for (const shallowPage of shallowJson) {
    const analyzedPage = await analysePage(shallowPage)
    analyzedPage?.forEach((postData, postId) => postsData.set(postId, postData))
  }
  return postsData
}

async function analysePage (shallowPage: ShallowJson[number]) {
  const postData = new Map<string, PostData>()
  const { number, url, content, isValid } = shallowPage
  if (!isValid) return;
  const dom = new JSDOM(content)
  const { window: { document } } = dom
  const page = document.querySelector('#page')
  if (page === null) return;
  const posts = page.querySelectorAll('article.post')
  if (posts.length === 0) return;
  for (const postElement of Array.from(posts)) {
    const id = postElement.getAttribute('id')?.split('post-').at(1)
    if (id === undefined) continue
    const type = Array
      .from(postElement.classList)
      .find(clss => clss.trim().match(/^type\-/igm))
      ?.replace(/^type\-/igm, '')
    const mediaContainer = postElement.querySelector('.post-panel .media')
    const youtubeIframeContainer = mediaContainer?.querySelector('iframe[src^="https://www.youtube.com/embed/"]') ?? null
    const youtubeIframeId = youtubeIframeContainer
      ?.getAttribute('src')
      ?.split('https://www.youtube.com/embed/').at(1)
      ?.split('?').at(0)
    const youtubeIframeTitle = youtubeIframeContainer?.getAttribute('title') ?? undefined
    const postContent = postElement.querySelector('.post-panel .copy')?.textContent?.trim()
    const postMetaListElement = postElement.querySelector('.post-panel .meta .meta-list')
    const postDateElement = postMetaListElement?.querySelector('.date a')
    const postPermalinkElement = postMetaListElement?.querySelector('.permalink a')
    const postDate = postDateElement?.getAttribute('title')
    const postUrl = postPermalinkElement?.getAttribute('href')
    postData.set(id, {
      id,
      url: postUrl ?? null,
      date: postDate ?? null,
      type: type ?? null,
      post_element_outerhtml: postElement.outerHTML,
      youtube_id: youtubeIframeId ?? null,
      youtube_title: youtubeIframeTitle ?? null,
      post_content: postContent ?? null
    })
  }
  return postData
}
