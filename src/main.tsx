import { render } from 'preact';
import './theme/tokens.css';
import './theme/base.css';
import { App } from './app';
import { avviaPwa } from './lib/pwa';

render(<App />, document.getElementById('app')!);
avviaPwa();
