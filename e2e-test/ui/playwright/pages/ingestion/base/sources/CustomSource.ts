import { BaseSource } from './BaseSource';

export class CustomSource extends BaseSource {
  async fillForm(): Promise<void> {
    const editor = this.page.locator('.monaco-scrollable-element').first();
    await editor.waitFor({state: 'visible'});
    await editor.click();
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.type('source:\n    type: demo-data\nconfig: {}');
  }
}
