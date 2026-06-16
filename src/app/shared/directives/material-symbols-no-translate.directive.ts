import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  inject,
  OnDestroy,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appMaterialSymbolsNoTranslate]',
  standalone: true,
})
export class MaterialSymbolsNoTranslateDirective
  implements AfterViewInit, OnDestroy
{
  private document = inject(DOCUMENT);
  private renderer = inject(Renderer2);
  private observer?: MutationObserver;

  ngAfterViewInit(): void {
    this.markIcons();

    this.observer = new MutationObserver(() => this.markIcons());
    this.observer.observe(this.document.body, {
      childList: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private markIcons(): void {
    this.document
      .querySelectorAll('.material-symbols-outlined')
      .forEach((icon) => {
        this.renderer.addClass(icon, 'notranslate');
        this.renderer.setAttribute(icon, 'translate', 'no');
      });
  }
}
