import { Component, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Language } from '../interfaces/lang.interface';

@Component({
  selector: 'app-lang-switcher',
  imports: [],
  templateUrl: './lang-switcher.html',
  styleUrl: './lang-switcher.css',
})
export class LangSwitcher {
  private readonly translate = inject(TranslateService);

  languages: Language[] = [
    { code: 'de', name: 'deutsch', icon: '' },
    { code: 'en', name: 'english', icon: '' },
  ];

  currentLang = this.translate.getCurrentLang() || 'en';

  constructor() {
    const savedLang = localStorage.getItem('lang') || 'en';

    this.translate.use(savedLang);
    this.currentLang = savedLang;
  }

  switchLang(lang: string) {
    this.translate.use(lang);
    this.currentLang = lang;
    localStorage.setItem('lang', lang);
  }
}
