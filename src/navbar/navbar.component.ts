import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { HistoryService } from '../services/history.service';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { RouterLink } from '@angular/router';
import { invoke } from '@tauri-apps/api/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzDropDownModule, NzButtonModule, RouterLink, NzModalModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  constructor(private historyService: HistoryService, private nzModalService: NzModalService) { }

  isHistoryAvailable(): boolean {
    return this.historyService.canGoBack();
  }

  onBack(): void {
    this.historyService.back();
  }

  exitApp(){
    this.nzModalService.confirm({
      nzTitle: 'Are you sure you want to quit?',
      nzContent: '',
      nzOnOk: () => invoke("close_app")
    });
    ;
  }
}
