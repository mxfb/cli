import { render } from 'react-dom'
import App from './components/App'

const target = document.querySelector('.root')
if (target !== null) render(<App />, target)
