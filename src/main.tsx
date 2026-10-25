import { render } from 'preact';
import './theme/tokens.css';
import './theme/base.css';
import { App } from './app';

render(<App />, document.getElementById('app')!);
