import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Sidebar } from './sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslateModule, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('serverCockpit');
}
