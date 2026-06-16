import { CommonModule } from '@angular/common';
import { Component, input, model, OnInit } from '@angular/core';

@Component({
  selector: 'app-collapse-expand-btn',
  imports: [CommonModule],
  templateUrl: './collapse-expand-btn.component.html',
  styleUrl: './collapse-expand-btn.component.css',
})
export class CollapseExpandBtnComponent implements OnInit {
  buttonType = input<string>();
  isCollapsedOnCreation = input.required<boolean>();
  isCollapsed = model.required<boolean>();

  ngOnInit() {
    this.isCollapsed.set(this.isCollapsedOnCreation());
  }

  protected onClick(): void {
    this.isCollapsed.update((value) => !value);
  }
}
