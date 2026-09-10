import { render } from 'preact';
import { WorldEditorApp } from './WorldEditorApp';

const container = document.getElementById('world-editor-app');
if (container) {
  render(<WorldEditorApp />, container);
}