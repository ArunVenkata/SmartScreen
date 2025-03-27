import { Component, OnInit } from '@angular/core';
import { invoke } from "@tauri-apps/api/core";
import { EventResponse } from '../types';
import { BaseComponent } from '../app/base-component';
@Component({
  selector: 'app-uuid-generator',
  standalone: true,
  imports: [],
  templateUrl: './uuid-generator.component.html',
  styleUrl: './uuid-generator.component.css'
})
export class UuidGeneratorComponent extends BaseComponent implements OnInit {

  uuid!: string;
  
  ngOnInit(): void {
    this.getUUID()
  }

  getUUID(){
    invoke<EventResponse>("get_uuid_str").then((data: EventResponse) => {
      console.log("UUID", data);
    });
  }
}


