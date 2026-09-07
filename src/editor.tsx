import { render } from 'preact';
import { EditorApp } from './EditorApp';

const container = document.getElementById('editor-app');
if (container) {
  render(<EditorApp />, container);
}