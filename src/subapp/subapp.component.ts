import { Component, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponent } from '../app/base-component';
import { takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Applications } from '../appconfig';

@Component({
  selector: 'app-subapp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subapp.component.html',
  styleUrl: './subapp.component.css'
})
export class SubappComponent extends BaseComponent implements OnDestroy, OnInit {
  app!: any;
  constructor(private activateRoute: ActivatedRoute,
    private viewContainerRef: ViewContainerRef
  ) {
    super();
    this.activateRoute.paramMap.pipe(takeUntil(this.ngUnsubscribe$)).subscribe((params) => {
      const app = Applications.find((item: any) =>  item.id == params.get("app_id"));
      if(app){
        this.app = app;
      }
      console.log("ROUTE PARAMS", params, app);
    });
  }

  ngOnInit(): void {

  }

}
