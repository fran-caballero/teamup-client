import { NgStyle } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  imports: [NgStyle],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.css',
})
export class UserAvatarComponent {
  username = input.required<string>();
  styles = input<Record<string, string>>();
  showRemoveIndicator = input<boolean>(false);
}
