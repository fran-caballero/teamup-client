import { NgStyle } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-list-symbol',
  imports: [NgStyle],
  templateUrl: './list-symbol.component.html',
  styleUrl: './list-symbol.component.css',
})
export class ListSymbolComponent {
  styles = input<object>();
}
