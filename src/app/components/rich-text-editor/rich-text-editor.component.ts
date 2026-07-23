import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, forwardRef, Input, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
  template: `
    <div class="rich-editor" [class.rich-editor--disabled]="disabled" [class.rich-editor--error]="!!error">
      <div class="rich-editor__toolbar" role="toolbar" aria-label="Editor de texto">
        <button mat-icon-button type="button" matTooltip="Desfazer" [disabled]="disabled" (click)="exec('undo')"><mat-icon>undo</mat-icon></button>
        <button mat-icon-button type="button" matTooltip="Refazer" [disabled]="disabled" (click)="exec('redo')"><mat-icon>redo</mat-icon></button>
        <span class="divider"></span>
        <button mat-icon-button type="button" matTooltip="Negrito" [disabled]="disabled" (click)="exec('bold')"><mat-icon>format_bold</mat-icon></button>
        <button mat-icon-button type="button" matTooltip="Italico" [disabled]="disabled" (click)="exec('italic')"><mat-icon>format_italic</mat-icon></button>
        <button mat-icon-button type="button" matTooltip="Sublinhado" [disabled]="disabled" (click)="exec('underline')"><mat-icon>format_underlined</mat-icon></button>
        <span class="divider"></span>
        <button mat-icon-button type="button" matTooltip="Titulo" [disabled]="disabled" (click)="formatBlock('h2')"><mat-icon>title</mat-icon></button>
        <button mat-icon-button type="button" matTooltip="Subtitulo" [disabled]="disabled" (click)="formatBlock('h3')"><mat-icon>subtitles</mat-icon></button>
        <button mat-icon-button type="button" matTooltip="Paragrafo" [disabled]="disabled" (click)="formatBlock('p')"><mat-icon>notes</mat-icon></button>
        <span class="divider"></span>
        <button mat-icon-button type="button" matTooltip="Lista com marcadores" [disabled]="disabled" (click)="exec('insertUnorderedList')"><mat-icon>format_list_bulleted</mat-icon></button>
        <button mat-icon-button type="button" matTooltip="Lista numerada" [disabled]="disabled" (click)="exec('insertOrderedList')"><mat-icon>format_list_numbered</mat-icon></button>
        <button mat-icon-button type="button" matTooltip="Link" [disabled]="disabled" (click)="createLink()"><mat-icon>link</mat-icon></button>
        <button mat-icon-button type="button" matTooltip="Remover formatacao" [disabled]="disabled" (click)="clearFormatting()"><mat-icon>format_clear</mat-icon></button>
      </div>

      <div
        #editable
        class="rich-editor__content"
        contenteditable="true"
        [attr.aria-label]="placeholder"
        [attr.data-placeholder]="placeholder"
        [style.min-height.px]="minHeight"
        (input)="onInput()"
        (blur)="onTouched()"
        (paste)="onPaste($event)"
      ></div>
    </div>
    <div class="rich-editor__footer">
      <span class="error" *ngIf="error">{{ error }}</span>
      <span class="counter" *ngIf="maxLength">{{ plainTextLength }} / {{ maxLength }}</span>
    </div>
  `,
  styles: [`
    .rich-editor {
      border: 1px solid #d7dde4;
      border-radius: 8px;
      background: #fff;
      overflow: hidden;
    }
    .rich-editor--error { border-color: #d32f2f; }
    .rich-editor--disabled { opacity: .7; pointer-events: none; background: #f8fafc; }
    .rich-editor__toolbar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
      padding: 6px;
      border-bottom: 1px solid #e5eaef;
      background: #f8fafc;
    }
    .rich-editor__toolbar button { width: 34px; height: 34px; line-height: 34px; }
    .divider { width: 1px; height: 24px; background: #d7dde4; margin: 0 4px; }
    .rich-editor__content {
      padding: 12px 14px;
      outline: none;
      line-height: 1.55;
    }
    .rich-editor__content:empty::before {
      content: attr(data-placeholder);
      color: #8b95a1;
      pointer-events: none;
    }
    .rich-editor__content h2 { font-size: 20px; margin: 0 0 10px; }
    .rich-editor__content h3 { font-size: 17px; margin: 0 0 8px; }
    .rich-editor__content p { margin: 0 0 10px; }
    .rich-editor__content ul,
    .rich-editor__content ol { margin: 0 0 10px 20px; padding: 0; }
    .rich-editor__footer {
      min-height: 22px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 4px;
      font-size: 12px;
      color: #6b7280;
    }
    .error { color: #d32f2f; }
    .counter { margin-left: auto; }
  `],
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit {
  @Input() placeholder = 'Digite o conteudo';
  @Input() minHeight = 180;
  @Input() maxLength?: number;
  @Input() error?: string | null;
  @ViewChild('editable') editable?: ElementRef<HTMLDivElement>;

  disabled = false;
  plainTextLength = 0;
  private value = '';
  private viewReady = false;
  private onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderValue();
  }

  writeValue(value: string | null): void {
    this.value = value || '';
    this.renderValue();
  }

  registerOnChange(fn: (value: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.editable?.nativeElement) {
      this.editable.nativeElement.contentEditable = String(!isDisabled);
    }
  }

  exec(command: string): void {
    document.execCommand(command, false);
    this.syncFromDom();
  }

  formatBlock(tag: 'h2' | 'h3' | 'p'): void {
    document.execCommand('formatBlock', false, tag);
    this.syncFromDom();
  }

  createLink(): void {
    const url = window.prompt('URL do link');
    if (!url) return;
    document.execCommand('createLink', false, url);
    this.syncFromDom();
  }

  clearFormatting(): void {
    document.execCommand('removeFormat', false);
    this.formatBlock('p');
  }

  onInput(): void {
    this.syncFromDom();
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const html = event.clipboardData?.getData('text/html');
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertHTML', false, this.cleanHtml(html || textToHtml(text)));
    this.syncFromDom();
  }

  private renderValue(): void {
    if (!this.viewReady || !this.editable?.nativeElement) return;
    this.editable.nativeElement.innerHTML = this.cleanHtml(this.value);
    this.updateCounter();
  }

  private syncFromDom(): void {
    const html = this.cleanHtml(this.editable?.nativeElement.innerHTML || '');
    this.value = html;
    this.updateCounter();
    this.onChange(html.trim() ? html : null);
  }

  private updateCounter(): void {
    this.plainTextLength = (this.editable?.nativeElement.textContent || '').trim().length;
  }

  private cleanHtml(value: string): string {
    const doc = new DOMParser().parseFromString(value || '', 'text/html');
    const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'H2', 'H3', 'UL', 'OL', 'LI', 'A']);
    const walk = (node: Node): void => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const element = child as HTMLElement;
          walk(element);
          if (!allowed.has(element.tagName)) {
            element.replaceWith(...Array.from(element.childNodes));
            return;
          }
          Array.from(element.attributes).forEach((attr) => {
            if (element.tagName === 'A' && attr.name === 'href') return;
            element.removeAttribute(attr.name);
          });
          if (element.tagName === 'A') {
            const href = element.getAttribute('href') || '';
            if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
              element.removeAttribute('href');
            } else {
              element.setAttribute('target', '_blank');
              element.setAttribute('rel', 'noopener');
            }
          }
        }
      });
    };
    walk(doc.body);
    return doc.body.innerHTML
      .replace(/<(b)>/gi, '<strong>').replace(/<\/(b)>/gi, '</strong>')
      .replace(/<(i)>/gi, '<em>').replace(/<\/(i)>/gi, '</em>');
  }
}

function textToHtml(text: string): string {
  return String(text || '')
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}
