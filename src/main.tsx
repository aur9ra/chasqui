import { hydrate } from 'preact'
import './index.css'
import { Page } from './page.tsx'

hydrate(<Page />, document.getElementById('app')!)
