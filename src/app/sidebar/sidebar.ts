import { Component, signal } from '@angular/core';
import { LangSwitcher } from '../lang-switcher/lang-switcher';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NavTree } from '../interfaces/navtree.interface';

@Component({
  selector: 'app-sidebar',
  imports: [LangSwitcher, RouterLink, TranslatePipe, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  darkMode = signal(localStorage.getItem('theme') || 'dark');
  navtree: NavTree[] = [
    {
      label: 'SIDEBAR.DASHBOARD',
      icon: '',
      route: 'dashboard',
    },
    {
      label: 'SIDEBAR.APPS',
      icon: '',
      route: 'apps',
    },
    {
      label: 'SIDEBAR.DISCOVERY',
      icon: '',
      route: 'discovery',
    },
  ];

  constructor() {
    if (this.darkMode() === 'light') {
      document.body.classList.add('light-theme');
    }
  }

  changeMode() {
    if (this.darkMode() === 'dark') {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
      return this.darkMode.set('light');
    }
    document.body.classList.remove('light-theme');
    localStorage.setItem('theme', 'dark');
    return this.darkMode.set('dark');
  }
}
