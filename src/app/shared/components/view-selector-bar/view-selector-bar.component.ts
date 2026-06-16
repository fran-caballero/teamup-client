import { Component, computed, input, model } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BoardSymbolComponent } from '@shared/components/icons/board-symbol/board-symbol.component';
import { ListSymbolComponent } from '@shared/components/icons/list-symbol/list-symbol.component';

@Component({
  selector: 'app-view-selector-bar',
  imports: [RouterModule, BoardSymbolComponent, ListSymbolComponent],
  templateUrl: './view-selector-bar.component.html',
  styleUrl: './view-selector-bar.component.css',
})
export class ViewSelectorBarComponent {
  type = input.required<'inFullView' | 'embedded'>();
  inputView = input<'board' | 'list'>();
  selectedView = model<'list' | 'board'>('board');
  currentView = computed(() =>
    this.type() === 'inFullView'
      ? (this.inputView() ?? 'board')
      : this.selectedView(),
  );
}
