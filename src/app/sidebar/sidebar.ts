import { Component } from '@angular/core';
import { LangSwitcher } from '../lang-switcher/lang-switcher';

@Component({
  selector: 'app-sidebar',
  imports: [LangSwitcher],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {}
