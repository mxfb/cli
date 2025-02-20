const $responses = document.querySelector('.requests')
const $createRandomProject = document.querySelector('.create-random-project')

async function fetchAndLog (url, method, body) {
  const id = Math.random().toString(36).slice(2)
  console.log('%cSending request...', 'font-weight: 600')
  console.log('id:', id)
  console.log(`${method}:`, url)
  const response = await window.fetch(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })
  const json = await response.json()
  console.log('%cReceived response', 'font-weight: 600')
  console.log('id:', id)
  console.log(`${method}:`, url)
  console.log('body:', body)
  console.log('response:', response)
  console.log('json:', json)
}

$createRandomProject.addEventListener('click', () => {
  fetchAndLog('http://localhost:3000/projects/create', 'POST', {
    name: 'Mon premier projet :\')',
    publicationTargetDate: Date.now(),
    sourcesIds: [],
    articlesIds: [],
    assetsIds: [],
  })
})
