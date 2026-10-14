import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KeepAliveService } from './core/keep-alive.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
  constructor(private keepAlive: KeepAliveService) {}

  ngOnInit(): void {
    this.keepAlive.start();
  }
}
