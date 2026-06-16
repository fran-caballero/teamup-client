import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appIsEllipsed]',
  exportAs: 'appIsEllipsed',
  standalone: true,
})
export class isEllipsedDirective implements AfterViewInit, OnDestroy {
  private resizeObserver: ResizeObserver;
  isEllipsed = false;

  constructor(private elementRef: ElementRef<HTMLElement>) {
    this.resizeObserver = new ResizeObserver(() => this.checkEllipsis());
  }

  ngAfterViewInit(): void {
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver.disconnect();
  }

  private checkEllipsis(): void {
    const element = this.elementRef.nativeElement;
    const isCurrentlyEllipsed = element.scrollWidth > element.clientWidth;

    if (this.isEllipsed !== isCurrentlyEllipsed) {
      this.isEllipsed = isCurrentlyEllipsed;
    }
  }
}
