import { hydrate } from 'preact'
import './index.css'
import { Page } from './page.tsx'
import { Header } from './header.tsx'

hydrate(<Page />, document.getElementById('app')!)
