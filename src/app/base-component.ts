import { Directive, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";


@Directive()
export abstract class BaseComponent implements OnDestroy{

    ngUnsubscribe$: Subject<boolean> = new Subject();
    
    ngOnDestroy(){
        this.ngUnsubscribe$.next(true);
        this.ngUnsubscribe$.complete();
    }


}
