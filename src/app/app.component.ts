import { Component, OnDestroy, OnInit } from '@angular/core';

import { BaseComponent } from './base-component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StorageService } from '../services/storage.service';
import { NavbarComponent } from "../navbar/navbar.component";
import {  RouterOutlet } from '@angular/router';
import { HistoryService } from '../services/history.service';
import { Applications } from '../appconfig';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: []
})
export class AppComponent extends BaseComponent implements OnInit, OnDestroy {
  greetingMessage = "";
  appList = Applications

  constructor(private nzMessageService: NzMessageService, private storageService: StorageService, private historyService: HistoryService) {
    super();
  }

  isBasePath(): boolean {
    return window.location.pathname === '/';
  }

  ngOnInit(): void {
  }
}
